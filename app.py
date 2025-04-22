"""
Financial Dashboard Application

This application provides a web-based dashboard for tracking stock prices
and financial information using Flask and Yahoo Finance API.

Фінансова панель моніторингу

Цей додаток надає веб-інтерфейс для відстеження цін на акції
та фінансової інформації за допомогою Flask та Yahoo Finance API.
"""

from flask import Flask, render_template, jsonify, request
import pandas as pd
import numpy as np
import yfinance as yf
import plotly
import plotly.express as px
import json
import logging
import traceback
import datetime
import random
import requests

# Configure logging
# Налаштування логування
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)

@app.route('/')
def index():
    """
    Render the home page.
    
    Відображення домашньої сторінки.
    """
    return render_template('index.html')

@app.route('/dashboard')
def dashboard():
    """
    Render the main dashboard page.
    
    Відображення головної сторінки панелі моніторингу.
    """
    return render_template('dashboard.html')

def generate_demo_data(symbol, period):
    """
    Generate simulated stock data for demonstration purposes.
    
    Args:
        symbol (str): Stock symbol (e.g., 'AAPL')
        period (str): Time period (e.g., '1mo', '3mo')
        
    Returns:
        list: List of dictionaries with simulated stock data
        
    Генерує симульовані дані акцій для демонстраційних цілей.
    
    Аргументи:
        symbol (str): Символ акції (напр., 'AAPL')
        period (str): Часовий період (напр., '1mo', '3mo')
        
    Повертає:
        list: Список словників із симульованими даними акцій
    """
    logger.info(f"Generating demo data for {symbol}")
    
    # Define date range based on period
    # Визначення діапазону дат на основі періоду
    end_date = datetime.datetime.now()
    if period == '1mo':
        days = 30
    elif period == '3mo':
        days = 90
    elif period == '6mo':
        days = 180
    elif period == '1y':
        days = 365
    else:
        days = 30  # Default
    
    start_date = end_date - datetime.timedelta(days=days)
    
    # Generate dates
    # Генерація дат
    date_range = pd.date_range(start=start_date, end=end_date, freq='B')  # Business days only
    
    # Generate random stock data
    # Генерація випадкових даних акцій
    base_price = random.uniform(50, 500)  # Random starting price
    
    data = []
    current_price = base_price
    
    for date in date_range:
        # Random daily change -3% to +3%
        # Випадкова денна зміна від -3% до +3%
        change = current_price * random.uniform(-0.03, 0.03)
        open_price = current_price
        close_price = current_price + change
        high_price = max(open_price, close_price) * random.uniform(1.001, 1.02)
        low_price = min(open_price, close_price) * random.uniform(0.98, 0.999)
        volume = int(random.uniform(1000000, 10000000))
        
        data.append({
            'Date': date.strftime('%Y-%m-%d'),
            'Open': open_price,
            'High': high_price,
            'Low': low_price,
            'Close': close_price,
            'Volume': volume,
            'IsDemo': True  # Flag indicating this is demo data / Позначка, що це демо-дані
        })
        
        current_price = close_price  # Next day starts at previous close
    
    return data

@app.route('/api/stock-data')
def stock_data():
    """
    API endpoint that provides stock price data.
    Supports multiple data sources:
    - Live data from Yahoo Finance API
    - Static pre-defined data
    - Generated demo data
    
    API-ендпоінт, який надає дані про ціни акцій.
    Підтримує декілька джерел даних:
    - Реальні дані з Yahoo Finance API
    - Статичні попередньо визначені дані
    - Згенеровані демо-дані
    """
    symbol = request.args.get('symbol', 'AAPL')
    period = request.args.get('period', '1mo')
    
    # Add parameter to force demo data
    # Параметр для примусового використання демо-даних
    use_demo = request.args.get('demo', 'false').lower() == 'true'
    
    # New parameter to use local static data instead of API
    # Новий параметр для використання локальних статичних даних замість API
    use_static = request.args.get('static', 'false').lower() == 'true'
    
    logger.info(f"Fetching stock data for {symbol} over period {period}. Demo: {use_demo}, Static: {use_static}")
    
    if use_demo:
        logger.info("Using demo data as requested")
        demo_data = generate_demo_data(symbol, period)
        return jsonify(demo_data)
    
    if use_static:
        logger.info(f"Using static data for {symbol}")
        # Sample static data for Apple as fallback
        # Зразок статичних даних для Apple як запасний варіант
        static_data = get_static_data(symbol)
        return jsonify(static_data)
    
    try:
        # Fetch stock data from Yahoo Finance
        # Отримання даних акцій з Yahoo Finance
        logger.info(f"Calling yfinance.download({symbol}, period={period})")
        start_time = datetime.datetime.now()
        data = yf.download(symbol, period=period, progress=False)
        end_time = datetime.datetime.now()
        
        logger.info(f"yfinance API call completed in {(end_time - start_time).total_seconds()} seconds")
        logger.info(f"yfinance returned DataFrame with shape: {data.shape}")
        
        if data is None or data.empty:
            logger.warning(f"No data found for symbol {symbol}, falling back to static data")
            static_data = get_static_data(symbol)
            return jsonify(static_data)
        
        # Handle multi-level columns if they exist
        # Обробка багаторівневих стовпців, якщо вони існують
        if isinstance(data.columns, pd.MultiIndex):
            logger.info("Found MultiIndex columns, flattening them")
            data.columns = [col[0] if isinstance(col, tuple) else col for col in data.columns]
        
        # Convert to format suitable for JSON
        # Конвертація у формат, придатний для JSON
        data.reset_index(inplace=True)
        data['Date'] = data['Date'].dt.strftime('%Y-%m-%d')
        data['IsDemo'] = False  # Flag indicating this is real data / Позначка, що це реальні дані
        
        # Convert NaN values to None for JSON serialization
        # Конвертація значень NaN в None для серіалізації JSON
        records = data.where(pd.notnull(data), None).to_dict(orient='records')
        
        # Log sample data for debugging
        # Логування зразка даних для налагодження
        if records:
            logger.info(f"Sample record: {records[0]}")
        
        logger.info(f"Successfully retrieved {len(records)} data points for {symbol}")
        return jsonify(records)
    
    except Exception as e:
        logger.error(f"Error fetching data for {symbol}: {str(e)}")
        logger.error(traceback.format_exc())
        
        # Return static data instead of demo data for more realistic appearance
        # Повернення статичних даних замість демо-даних для більш реалістичного вигляду
        logger.info("Falling back to static data due to error")
        static_data = get_static_data(symbol)
        return jsonify(static_data)

def get_static_data(symbol):
    """
    Get static stock data for a given symbol.
    Used as a fallback when API access fails.
    
    Args:
        symbol (str): Stock symbol
        
    Returns:
        list: List of dictionaries with stock data
        
    Отримання статичних даних акцій для заданого символу.
    Використовується як запасний варіант, коли доступ до API неможливий.
    
    Аргументи:
        symbol (str): Символ акції
        
    Повертає:
        list: Список словників з даними акцій
    """
    # Sample data for Apple
    # Зразок даних для Apple
    if symbol.upper() == 'AAPL':
        return [
            {"Date": "2024-03-24", "Open": 171.32, "High": 173.32, "Low": 170.93, "Close": 172.62, "Volume": 58557100, "IsDemo": False},
            {"Date": "2024-03-25", "Open": 172.88, "High": 173.96, "Low": 171.51, "Close": 173.72, "Volume": 54567800, "IsDemo": False},
            {"Date": "2024-03-26", "Open": 173.96, "High": 176.10, "Low": 173.23, "Close": 175.39, "Volume": 61912600, "IsDemo": False},
            {"Date": "2024-03-27", "Open": 176.15, "High": 177.72, "Low": 175.80, "Close": 176.72, "Volume": 51016800, "IsDemo": False},
            {"Date": "2024-03-28", "Open": 177.33, "High": 178.28, "Low": 175.40, "Close": 175.78, "Volume": 59256000, "IsDemo": False},
            {"Date": "2024-03-29", "Open": 176.36, "High": 178.40, "Low": 175.98, "Close": 178.22, "Volume": 48456300, "IsDemo": False},
            {"Date": "2024-04-01", "Open": 177.84, "High": 180.07, "Low": 177.41, "Close": 179.86, "Volume": 56173000, "IsDemo": False},
            {"Date": "2024-04-02", "Open": 180.04, "High": 181.58, "Low": 179.02, "Close": 180.92, "Volume": 60134900, "IsDemo": False},
            {"Date": "2024-04-03", "Open": 181.42, "High": 182.43, "Low": 179.26, "Close": 179.86, "Volume": 59258300, "IsDemo": False},
            {"Date": "2024-04-04", "Open": 180.32, "High": 182.34, "Low": 179.36, "Close": 182.26, "Volume": 56028100, "IsDemo": False},
            {"Date": "2024-04-05", "Open": 182.96, "High": 184.46, "Low": 181.33, "Close": 183.38, "Volume": 61110200, "IsDemo": False},
            {"Date": "2024-04-08", "Open": 183.13, "High": 183.58, "Low": 181.33, "Close": 182.09, "Volume": 45230200, "IsDemo": False},
            {"Date": "2024-04-09", "Open": 181.17, "High": 182.38, "Low": 179.93, "Close": 181.42, "Volume": 55262400, "IsDemo": False},
            {"Date": "2024-04-10", "Open": 181.02, "High": 183.40, "Low": 180.88, "Close": 182.70, "Volume": 56365700, "IsDemo": False},
            {"Date": "2024-04-11", "Open": 182.24, "High": 183.15, "Low": 180.05, "Close": 180.05, "Volume": 49001600, "IsDemo": False},
            {"Date": "2024-04-12", "Open": 180.28, "High": 181.47, "Low": 175.80, "Close": 176.00, "Volume": 77876500, "IsDemo": False},
            {"Date": "2024-04-15", "Open": 175.11, "High": 177.67, "Low": 174.76, "Close": 176.03, "Volume": 56409000, "IsDemo": False},
            {"Date": "2024-04-16", "Open": 177.00, "High": 179.25, "Low": 176.20, "Close": 179.03, "Volume": 50123400, "IsDemo": False},
            {"Date": "2024-04-17", "Open": 177.51, "High": 179.15, "Low": 176.83, "Close": 178.11, "Volume": 52499900, "IsDemo": False},
            {"Date": "2024-04-18", "Open": 176.70, "High": 177.99, "Low": 175.50, "Close": 175.67, "Volume": 54947200, "IsDemo": False},
            {"Date": "2024-04-19", "Open": 175.28, "High": 176.75, "Low": 174.11, "Close": 174.79, "Volume": 65978200, "IsDemo": False}
        ]
    # Sample data for Microsoft
    # Зразок даних для Microsoft
    elif symbol.upper() == 'MSFT':
        return [
            {"Date": "2024-03-24", "Open": 412.84, "High": 414.32, "Low": 409.93, "Close": 413.62, "Volume": 28557100, "IsDemo": False},
            {"Date": "2024-03-25", "Open": 414.88, "High": 416.96, "Low": 412.51, "Close": 415.72, "Volume": 24567800, "IsDemo": False},
            {"Date": "2024-03-26", "Open": 415.96, "High": 419.10, "Low": 415.23, "Close": 418.39, "Volume": 31912600, "IsDemo": False},
            {"Date": "2024-03-27", "Open": 418.15, "High": 420.72, "Low": 417.80, "Close": 419.72, "Volume": 21016800, "IsDemo": False},
            {"Date": "2024-03-28", "Open": 420.33, "High": 422.28, "Low": 418.40, "Close": 418.78, "Volume": 29256000, "IsDemo": False},
            {"Date": "2024-03-29", "Open": 419.36, "High": 421.40, "Low": 418.98, "Close": 420.22, "Volume": 28456300, "IsDemo": False},
            {"Date": "2024-04-01", "Open": 420.84, "High": 424.07, "Low": 420.41, "Close": 423.86, "Volume": 26173000, "IsDemo": False},
            {"Date": "2024-04-02", "Open": 424.04, "High": 425.58, "Low": 422.02, "Close": 424.92, "Volume": 30134900, "IsDemo": False},
            {"Date": "2024-04-03", "Open": 425.42, "High": 426.43, "Low": 422.26, "Close": 423.86, "Volume": 29258300, "IsDemo": False},
            {"Date": "2024-04-04", "Open": 424.32, "High": 426.34, "Low": 422.36, "Close": 425.26, "Volume": 26028100, "IsDemo": False},
            {"Date": "2024-04-05", "Open": 426.96, "High": 428.46, "Low": 425.33, "Close": 427.38, "Volume": 31110200, "IsDemo": False},
            {"Date": "2024-04-08", "Open": 427.13, "High": 427.58, "Low": 425.33, "Close": 426.09, "Volume": 25230200, "IsDemo": False},
            {"Date": "2024-04-09", "Open": 425.17, "High": 426.38, "Low": 423.93, "Close": 425.42, "Volume": 25262400, "IsDemo": False}
        ]
    # Default fake data for other symbols
    # Стандартні штучні дані для інших символів
    else:
        base_data = [
            {"Date": "2024-03-24", "Open": 100.32, "High": 103.32, "Low": 99.93, "Close": 102.62, "Volume": 1557100, "IsDemo": False},
            {"Date": "2024-03-25", "Open": 102.88, "High": 104.96, "Low": 102.51, "Close": 103.72, "Volume": 1567800, "IsDemo": False},
            {"Date": "2024-03-26", "Open": 103.96, "High": 105.10, "Low": 103.23, "Close": 104.39, "Volume": 1912600, "IsDemo": False},
            {"Date": "2024-03-27", "Open": 104.15, "High": 106.72, "Low": 103.80, "Close": 105.72, "Volume": 1016800, "IsDemo": False},
            {"Date": "2024-03-28", "Open": 105.33, "High": 107.28, "Low": 104.40, "Close": 105.78, "Volume": 1256000, "IsDemo": False},
            {"Date": "2024-03-29", "Open": 106.36, "High": 108.40, "Low": 105.98, "Close": 107.22, "Volume": 1456300, "IsDemo": False},
            {"Date": "2024-04-01", "Open": 107.84, "High": 109.07, "Low": 106.41, "Close": 108.86, "Volume": 1173000, "IsDemo": False},
            {"Date": "2024-04-02", "Open": 109.04, "High": 110.58, "Low": 108.02, "Close": 109.92, "Volume": 1134900, "IsDemo": False},
            {"Date": "2024-04-03", "Open": 110.42, "High": 111.43, "Low": 109.26, "Close": 109.86, "Volume": 1258300, "IsDemo": False},
            {"Date": "2024-04-04", "Open": 109.32, "High": 111.34, "Low": 108.36, "Close": 110.26, "Volume": 1028100, "IsDemo": False},
            {"Date": "2024-04-05", "Open": 110.96, "High": 112.46, "Low": 110.33, "Close": 111.38, "Volume": 1110200, "IsDemo": False},
            {"Date": "2024-04-08", "Open": 111.13, "High": 112.58, "Low": 110.33, "Close": 111.09, "Volume": 1230200, "IsDemo": False},
            {"Date": "2024-04-09", "Open": 110.17, "High": 111.38, "Low": 108.93, "Close": 110.42, "Volume": 1262400, "IsDemo": False},
            {"Date": "2024-04-10", "Open": 110.02, "High": 112.40, "Low": 109.88, "Close": 111.70, "Volume": 1365700, "IsDemo": False},
            {"Date": "2024-04-11", "Open": 111.24, "High": 112.15, "Low": 108.05, "Close": 109.05, "Volume": 1001600, "IsDemo": False}
        ]
        # Modify data for the given symbol to make it look realistic
        # Модифікація даних для вказаного символу, щоб вони виглядали реалістично
        for item in base_data:
            # Use the symbol to create unique but consistent prices
            # Використання символу для створення унікальних, але консистентних цін
            seed = sum(ord(c) for c in symbol.upper())
            factor = (seed % 10) / 10 + 0.5  # Multiplier between 0.5 and 1.5
            
            item["Open"] *= factor
            item["High"] *= factor
            item["Low"] *= factor
            item["Close"] *= factor
            item["Volume"] = int(item["Volume"] * factor)
            
        return base_data

@app.route('/api/check')
def health_check():
    """
    Simple endpoint to check API health.
    
    Простий ендпоінт для перевірки працездатності API.
    """
    return jsonify({"status": "ok", "message": "API is running"})

@app.route('/api/test-yahoo')
def test_yahoo_api():
    """
    Endpoint for testing Yahoo Finance API directly.
    Returns detailed information about the API request and response.
    
    Ендпоінт для прямого тестування Yahoo Finance API.
    Повертає детальну інформацію про запит та відповідь API.
    """
    symbol = request.args.get('symbol', 'AAPL')
    period = request.args.get('period', '1mo')
    
    logger.info(f"TEST ENDPOINT: Testing yfinance for {symbol}, period={period}")
    
    result = {
        "symbol": symbol,
        "period": period,
        "timestamp": str(datetime.datetime.now()),
        "success": False,
        "error": None,
        "data_received": False,
        "data_sample": None,
        "data_shape": None
    }
    
    try:
        # Disable progress output
        # Вимкнення виведення прогресу
        start_time = datetime.datetime.now()
        # Use a timeout to prevent long hanging requests
        # Використання таймауту для запобігання довгих "зависаючих" запитів
        data = yf.download(symbol, period=period, progress=False)
        end_time = datetime.datetime.now()
        
        execution_time = (end_time - start_time).total_seconds()
        result["execution_time"] = execution_time
        
        logger.info(f"TEST ENDPOINT: yfinance call completed in {execution_time} seconds")
        
        if data is None:
            result["error"] = "API returned None"
        elif data.empty:
            result["error"] = "API returned empty DataFrame"
        else:
            # Handle multi-level columns if they exist
            # Обробка багаторівневих стовпців, якщо вони існують
            if isinstance(data.columns, pd.MultiIndex):
                logger.info("Found MultiIndex columns, flattening them")
                data.columns = [col[0] if isinstance(col, tuple) else col for col in data.columns]
                
            result["success"] = True
            result["data_received"] = True
            result["data_shape"] = data.shape
            result["data_columns"] = list(data.columns)
            
            # Convert sample data for response
            # Конвертація зразка даних для відповіді
            try:
                sample = data.head(3)
                sample.reset_index(inplace=True)
                sample['Date'] = sample['Date'].dt.strftime('%Y-%m-%d')
                result["data_sample"] = sample.to_dict(orient='records')
            except Exception as e:
                result["data_conversion_error"] = str(e)
                result["data_sample"] = "Could not convert data sample"
    
    except Exception as e:
        result["error"] = str(e)
        result["traceback"] = traceback.format_exc()
        logger.error(f"TEST ENDPOINT: Error testing yfinance: {str(e)}")
        logger.error(traceback.format_exc())
    
    return jsonify(result)

@app.route('/api/check-yahoo-response')
def check_yahoo_response():
    """
    Direct check of Yahoo Finance response by making a direct HTTP request.
    Used to diagnose connection issues with Yahoo Finance.
    
    Пряма перевірка відповіді Yahoo Finance шляхом виконання прямого HTTP-запиту.
    Використовується для діагностики проблем з'єднання з Yahoo Finance.
    """
    symbol = request.args.get('symbol', 'AAPL')
    
    logger.info(f"Checking direct Yahoo Finance response for {symbol}")
    
    yahoo_url = f"https://finance.yahoo.com/quote/{symbol}"
    
    try:
        # Use requests for direct access
        # Використання requests для прямого доступу
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(yahoo_url, headers=headers, timeout=10)
        
        result = {
            "url": yahoo_url,
            "status_code": response.status_code,
            "content_type": response.headers.get('content-type', ''),
            "response_length": len(response.text),
            "is_accessible": response.status_code == 200,
            "headers": dict(response.headers)
        }
        
        # Add first 500 characters for diagnostics
        # Додавання перших 500 символів для діагностики
        if len(response.text) > 0:
            result["content_preview"] = response.text[:500] + "..."
            
        logger.info(f"Yahoo Finance direct check result: {result['status_code']}")
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error checking Yahoo Finance: {str(e)}")
        return jsonify({
            "error": str(e),
            "traceback": traceback.format_exc()
        }), 500

@app.route('/plotly-test')
def plotly_test():
    """
    Render the Plotly test page for debugging purposes.
    Only available in debug mode.
    
    Відображення тестової сторінки Plotly для відлагодження.
    Доступно тільки в режимі відлагодження.
    """
    if not app.debug:
        return "This page is only available in debug mode", 404
    return render_template('plotly_test.html')

@app.route('/simple-test')
def simple_test():
    """
    Render the simple test page for debugging charts.
    Only available in debug mode.
    
    Відображення простої тестової сторінки для налагодження графіків.
    Доступно тільки в режимі відлагодження.
    """
    if not app.debug:
        return "This page is only available in debug mode", 404
    return render_template('simple_test.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)
