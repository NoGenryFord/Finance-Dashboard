from flask import Flask, render_template, jsonify, request
import pandas as pd
import yfinance as yf
import plotly
import plotly.express as px
import json

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/api/stock-data')
def stock_data():
    symbol = request.args.get('symbol', 'AAPL')
    period = request.args.get('period', '1mo')
    
    # Fetch stock data
    data = yf.download(symbol, period=period)
    
    # Convert to format suitable for JSON
    data.reset_index(inplace=True)
    data['Date'] = data['Date'].dt.strftime('%Y-%m-%d')
    
    return jsonify(data.to_dict(orient='records'))

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)
