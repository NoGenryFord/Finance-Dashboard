/**
 * Financial Dashboard JavaScript
 * 
 * This file contains the client-side logic for the financial dashboard,
 * including chart creation, data fetching, and UI interactions.
 * 
 * Клієнтський JavaScript для фінансової панелі
 * 
 * Цей файл містить клієнтську логіку для фінансової панелі,
 * включаючи створення графіків, отримання даних та взаємодію з інтерфейсом.
 */

// Initialize the dashboard functionality
// Ініціалізація функціональності панелі моніторингу
function initDashboard() {
    console.log('Dashboard initialized');
    // Initial load
    // Початкове завантаження
    loadStockData();
    
    // Add event listener for the update button
    // Додавання обробника подій для кнопки оновлення
    document.getElementById('updateChart').addEventListener('click', loadStockData);
    
    // Add data source options
    // Додавання опцій для джерела даних
    const dataSourceControls = document.createElement('div');
    dataSourceControls.className = 'mt-3';
    dataSourceControls.innerHTML = `
        <div class="form-check">
            <input class="form-check-input" type="radio" name="dataSource" id="liveDataRadio" value="live" checked>
            <label class="form-check-label" for="liveDataRadio">
                Use live data (if available)
            </label>
        </div>
        <div class="form-check">
            <input class="form-check-input" type="radio" name="dataSource" id="staticDataRadio" value="static">
            <label class="form-check-label" for="staticDataRadio">
                Use static data (reliable, from cache)
            </label>
        </div>
        <div class="form-check">
            <input class="form-check-input" type="radio" name="dataSource" id="demoDataRadio" value="demo">
            <label class="form-check-label" for="demoDataRadio">
                Use demo data (random generation)
            </label>
        </div>
    `;
    document.querySelector('.card-body').appendChild(dataSourceControls);
    
    // Add a test Yahoo API button
    // Додавання кнопок для тестування API Yahoo
    const testButtonWrapper = document.createElement('div');
    testButtonWrapper.className = 'd-flex gap-2 mt-2';
    
    const testButton = document.createElement('button');
    testButton.className = 'btn btn-sm btn-info';
    testButton.innerHTML = 'Test Yahoo API';
    testButton.onclick = testYahooAPI;
    
    const directTestButton = document.createElement('button');
    directTestButton.className = 'btn btn-sm btn-warning';
    directTestButton.innerHTML = 'Check Direct Access';
    directTestButton.onclick = checkDirectYahooAccess;
    
    testButtonWrapper.appendChild(testButton);
    testButtonWrapper.appendChild(directTestButton);
    
    document.querySelector('.card-body').appendChild(testButtonWrapper);
}

// Call the init function when DOM is ready
// Виклик функції ініціалізації, коли DOM готовий
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the dashboard page
    // Перевірка, чи ми на сторінці dashboard
    if (document.getElementById('stockChart')) {
        console.log('Dashboard page detected, initializing...');
        initDashboard();
    }
});

/**
 * Loads stock data from the API and updates the dashboard
 * 
 * Завантажує дані акцій з API та оновлює панель моніторингу
 */
function loadStockData() {
    const symbol = document.getElementById('stockSymbol').value || 'AAPL';
    const period = document.getElementById('timePeriod').value || '1mo';
    
    // Get selected data source
    // Отримання вибраного джерела даних
    let dataSource = 'live';
    const dataSourceRadio = document.querySelector('input[name="dataSource"]:checked');
    if (dataSourceRadio) {
        dataSource = dataSourceRadio.value;
    }
    
    const useDemo = dataSource === 'demo';
    const useStatic = dataSource === 'static';
    
    console.log(`Fetching data for ${symbol} over ${period} period. Data source: ${dataSource}`);
    
    // Show loading state
    // Відображення стану завантаження
    document.getElementById('stockChart').innerHTML = 'Loading data...';
    document.getElementById('trendChart').innerHTML = 'Loading trend data...';
    
    // Set default values for performance metrics during loading
    // Встановлення значень за замовчуванням для метрик продуктивності під час завантаження
    document.getElementById('openingPrice').textContent = 'Loading...';
    document.getElementById('closingPrice').textContent = 'Loading...';
    document.getElementById('highPrice').textContent = 'Loading...';
    document.getElementById('lowPrice').textContent = 'Loading...';
    document.getElementById('volume').textContent = 'Loading...';
    
    // Створюємо URL API з параметрами
    const apiUrl = `/api/stock-data?symbol=${symbol}&period=${period}&demo=${useDemo}&static=${useStatic}`;
    
    // Використовуємо XMLHttpRequest для отримання даних
    const xhr = new XMLHttpRequest();
    xhr.open('GET', apiUrl, true);
    
    xhr.onload = function() {
        if (xhr.status === 200) {
            try {
                const data = JSON.parse(xhr.responseText);
                
                if (!data || data.length === 0) {
                    document.getElementById('stockChart').innerHTML = 'No data available for this symbol';
                    document.getElementById('trendChart').innerHTML = 'No trend data available';
                    resetPerformanceMetrics();
                    return;
                }
                
                try {
                    // Update the charts and metrics
                    // Оновлення графіків та метрик
                    createStockChart(data, symbol);
                    createTrendChart(data);
                    updatePerformanceMetrics(data);
                } catch (error) {
                    console.error('Error processing data:', error);
                    document.getElementById('stockChart').innerHTML = `Error processing data: ${error.message}`;
                    document.getElementById('trendChart').innerHTML = 'Error creating trend chart';
                    resetPerformanceMetrics();
                }
            } catch (e) {
                console.error('Error parsing JSON response:', e);
                document.getElementById('stockChart').innerHTML = 'Error parsing API response';
            }
        } else {
            console.error('XHR request failed, status:', xhr.status);
            document.getElementById('stockChart').innerHTML = `Error: API returned status ${xhr.status}`;
        }
    };
    
    xhr.onerror = function() {
        console.error('XHR request failed due to network error');
        document.getElementById('stockChart').innerHTML = 'Network error, please check your connection';
    };
    
    // Відправляємо запит
    xhr.send();
    
    // For demonstration, add some market summary data
    // Для демонстрації додаємо дані зведення по ринку
    updateMarketSummary(symbol);
}

/**
 * Reset performance metrics to default values
 * 
 * Скидання метрик продуктивності до значень за замовчуванням
 */
function resetPerformanceMetrics() {
    document.getElementById('openingPrice').textContent = '-';
    document.getElementById('closingPrice').textContent = '-';
    document.getElementById('highPrice').textContent = '-';
    document.getElementById('lowPrice').textContent = '-';
    document.getElementById('volume').textContent = '-';
}

/**
 * Create a candlestick chart for stock price data
 * 
 * @param {Array} data - Stock price data
 * @param {string} symbol - Stock symbol
 * 
 * Створення графіка "японських свічок" для даних про ціну акцій
 * 
 * @param {Array} data - Дані про ціну акцій
 * @param {string} symbol - Символ акції
 */
function createStockChart(data, symbol) {
    try {
        // Check if using demo data
        // Перевірка, чи використовуються демо-дані
        const isDemo = data[0]?.IsDemo === true;
        const chartTitle = isDemo ? 
            `${symbol} Stock Price (DEMO DATA)` : 
            `${symbol} Stock Price (REAL DATA)`;
        
        // Prepare data for Plotly
        // Підготовка даних для Plotly
        const dates = data.map(item => item.Date);
        const closePrices = data.map(item => item.Close);
        const openPrices = data.map(item => item.Open);
        const highPrices = data.map(item => item.High);
        const lowPrices = data.map(item => item.Low);
        
        // Create a candlestick chart
        // Створення графіка "японських свічок"
        const trace = {
            x: dates,
            close: closePrices,
            high: highPrices,
            low: lowPrices,
            open: openPrices,
            type: 'candlestick',
            xaxis: 'x',
            yaxis: 'y',
            increasing: {line: {color: isDemo ? '#6ba583' : '#26a69a'}},
            decreasing: {line: {color: isDemo ? '#d75442' : '#ef5350'}}
        };
        
        const layout = {
            title: chartTitle,
            xaxis: {
                title: 'Date',
                rangeslider: {visible: false}
            },
            yaxis: {
                title: 'Price'
            }
        };
        
        Plotly.newPlot('stockChart', [trace], layout);
        
        // Add visual indicator if demo data
        // Додавання візуального індикатора, якщо це демо-дані
        if (isDemo) {
            const demoIndicator = document.createElement('div');
            demoIndicator.className = 'alert alert-warning mt-2';
            demoIndicator.innerHTML = `<strong>Note:</strong> Showing simulated data. Real API data is unavailable.`;
            document.getElementById('stockChart').parentNode.appendChild(demoIndicator);
        }
    } catch (error) {
        console.error('Error creating stock chart:', error);
        document.getElementById('stockChart').innerHTML = `Error creating chart: ${error.message}`;
    }
}

/**
 * Create a line chart showing the closing price trend
 * 
 * @param {Array} data - Stock price data
 * 
 * Створення лінійного графіка, що показує тренд ціни закриття
 * 
 * @param {Array} data - Дані про ціну акцій
 */
function createTrendChart(data) {
    try {
        // Check if using demo data
        // Перевірка, чи використовуються демо-дані
        const isDemo = data[0]?.IsDemo === true;
        const chartTitle = isDemo ?
            'Closing Price Trend (DEMO DATA)' :
            'Closing Price Trend (REAL DATA)';
        
        // Simple line chart showing the closing price trend
        // Простий лінійний графік, що показує тренд ціни закриття
        const dates = data.map(item => item.Date);
        const closePrices = data.map(item => item.Close);
        
        const trace = {
            x: dates,
            y: closePrices,
            type: 'scatter',
            mode: 'lines',
            line: {
                color: isDemo ? '#ff7f0e' : '#17BECF',
                width: 2
            }
        };
        
        const layout = {
            title: chartTitle,
            xaxis: {
                title: 'Date'
            },
            yaxis: {
                title: 'Price'
            }
        };
        
        Plotly.newPlot('trendChart', [trace], layout);
    } catch (error) {
        console.error('Error creating trend chart:', error);
        document.getElementById('trendChart').innerHTML = `Error creating trend chart: ${error.message}`;
    }
}

/**
 * Update performance metrics table with latest data
 * 
 * @param {Array} data - Stock price data
 * 
 * Оновлення таблиці метрик продуктивності з останніми даними
 * 
 * @param {Array} data - Дані про ціну акцій
 */
function updatePerformanceMetrics(data) {
    try {
        // Get the most recent data point
        // Отримання найновішої точки даних
        const latestData = data[data.length - 1];
        
        // Update the metrics in the table
        // Оновлення метрик у таблиці
        document.getElementById('openingPrice').textContent = '$' + latestData.Open.toFixed(2);
        document.getElementById('closingPrice').textContent = '$' + latestData.Close.toFixed(2);
        document.getElementById('highPrice').textContent = '$' + latestData.High.toFixed(2);
        document.getElementById('lowPrice').textContent = '$' + latestData.Low.toFixed(2);
        document.getElementById('volume').textContent = latestData.Volume.toLocaleString();
    } catch (error) {
        console.error('Error updating performance metrics:', error);
        resetPerformanceMetrics();
    }
}

/**
 * Update market summary with stock information
 * Uses simulated data for demonstration purposes
 * 
 * @param {string} symbol - Stock symbol
 * 
 * Оновлення зведення по ринку з інформацією про акції
 * Використовує симульовані дані для демонстраційних цілей
 * 
 * @param {string} symbol - Символ акції
 */
function updateMarketSummary(symbol) {
    // In a real application, you would fetch this data from an API
    // В реальному додатку ці дані були б отримані з API
    const marketSummary = document.getElementById('marketSummary');
    
    try {
        // Generate a random change percentage between -2% and +2%
        // Генерація випадкового відсотка зміни між -2% та +2%
        const changePercent = (Math.random() * 4 - 2).toFixed(2);
        const changeClass = changePercent >= 0 ? 'text-success' : 'text-danger';
        const changeIcon = changePercent >= 0 ? '↑' : '↓';
        
        marketSummary.innerHTML = `
            <div class="d-flex justify-content-between">
                <div>
                    <h3>${symbol}</h3>
                    <p>Current market conditions</p>
                </div>
                <div>
                    <h3 class="${changeClass}">${changeIcon} ${Math.abs(changePercent)}%</h3>
                    <p>Today's change</p>
                </div>
            </div>
            <div class="mt-3">
                <p><strong>Market Status:</strong> Open</p>
                <p><strong>Last Updated:</strong> ${new Date().toLocaleTimeString()}</p>
            </div>
        `;
    } catch (error) {
        console.error('Error updating market summary:', error);
        marketSummary.innerHTML = 'Error loading market data';
    }
}

/**
 * Test Yahoo Finance API functionality
 * Displays the results of the API test in the UI
 * 
 * Тестування функціональності API Yahoo Finance
 * Відображає результати тесту API в інтерфейсі
 */
function testYahooAPI() {
    const symbol = document.getElementById('stockSymbol').value || 'AAPL';
    const period = document.getElementById('timePeriod').value || '1mo';
    
    console.log(`Testing Yahoo API for ${symbol} over ${period}`);
    
    // Create a status element
    // Створення елемента статусу
    let statusDiv = document.getElementById('apiTestStatus');
    if (!statusDiv) {
        statusDiv = document.createElement('div');
        statusDiv.id = 'apiTestStatus';
        statusDiv.className = 'alert alert-info mt-2';
        document.querySelector('.card-body').appendChild(statusDiv);
    }
    
    statusDiv.innerHTML = `Testing Yahoo API for ${symbol}...`;
    
    fetch(`/api/test-yahoo?symbol=${symbol}&period=${period}`)
        .then(response => response.json())
        .then(result => {
            console.log('API test result:', result);
            
            if (result.success) {
                statusDiv.className = 'alert alert-success mt-2';
                statusDiv.innerHTML = `
                    <strong>Success!</strong> Yahoo API returned data for ${symbol}.<br>
                    Data shape: ${result.data_shape}.<br>
                    Execution time: ${result.execution_time} seconds.<br>
                    <button class="btn btn-sm btn-outline-secondary mt-2" onclick="document.getElementById('apiResultJson').style.display = document.getElementById('apiResultJson').style.display === 'none' ? 'block' : 'none'">
                        Show/Hide Details
                    </button>
                    <pre id="apiResultJson" style="display: none; max-height: 200px; overflow: auto; margin-top: 10px; font-size: 11px;">
                    ${JSON.stringify(result, null, 2)}
                    </pre>
                `;
            } else {
                statusDiv.className = 'alert alert-danger mt-2';
                statusDiv.innerHTML = `
                    <strong>Error:</strong> Failed to get data from Yahoo API.<br>
                    Error: ${result.error || 'Unknown error'}<br>
                    <button class="btn btn-sm btn-outline-secondary mt-2" onclick="document.getElementById('apiResultJson').style.display = document.getElementById('apiResultJson').style.display === 'none' ? 'block' : 'none'">
                        Show/Hide Details
                    </button>
                    <pre id="apiResultJson" style="display: none; max-height: 200px; overflow: auto; margin-top: 10px; font-size: 11px;">
                    ${JSON.stringify(result, null, 2)}
                    </pre>
                `;
            }
        })
        .catch(error => {
            console.error('Error testing API:', error);
            statusDiv.className = 'alert alert-danger mt-2';
            statusDiv.innerHTML = `<strong>Error:</strong> ${error.message}`;
        });
}

/**
 * Check direct access to Yahoo Finance website
 * Helps diagnose if the website is accessible from the server
 * 
 * Перевірка прямого доступу до веб-сайту Yahoo Finance
 * Допомагає діагностувати, чи доступний веб-сайт з сервера
 */
function checkDirectYahooAccess() {
    const symbol = document.getElementById('stockSymbol').value || 'AAPL';
    
    console.log(`Checking direct access to Yahoo Finance for ${symbol}`);
    
    // Create a status element
    // Створення елемента статусу
    let statusDiv = document.getElementById('apiTestStatus');
    if (!statusDiv) {
        statusDiv = document.createElement('div');
        statusDiv.id = 'apiTestStatus';
        statusDiv.className = 'alert alert-info mt-2';
        document.querySelector('.card-body').appendChild(statusDiv);
    }
    
    statusDiv.innerHTML = `Checking direct access to Yahoo Finance for ${symbol}...`;
    
    fetch(`/api/check-yahoo-response?symbol=${symbol}`)
        .then(response => response.json())
        .then(result => {
            console.log('Direct check result:', result);
            
            if (result.is_accessible) {
                statusDiv.className = 'alert alert-success mt-2';
                statusDiv.innerHTML = `
                    <strong>Success!</strong> Yahoo Finance is accessible.<br>
                    Status code: ${result.status_code}<br>
                    Content type: ${result.content_type}<br>
                    <button class="btn btn-sm btn-outline-secondary mt-2" onclick="document.getElementById('apiDirectResultJson').style.display = document.getElementById('apiDirectResultJson').style.display === 'none' ? 'block' : 'none'">
                        Show/Hide Details
                    </button>
                    <pre id="apiDirectResultJson" style="display: none; max-height: 200px; overflow: auto; margin-top: 10px; font-size: 11px;">
                    ${JSON.stringify(result, null, 2)}
                    </pre>
                `;
            } else {
                statusDiv.className = 'alert alert-danger mt-2';
                statusDiv.innerHTML = `
                    <strong>Error:</strong> Yahoo Finance is not accessible.<br>
                    Status code: ${result.status_code}<br>
                    <button class="btn btn-sm btn-outline-secondary mt-2" onclick="document.getElementById('apiDirectResultJson').style.display = document.getElementById('apiDirectResultJson').style.display === 'none' ? 'block' : 'none'">
                        Show/Hide Details
                    </button>
                    <pre id="apiDirectResultJson" style="display: none; max-height: 200px; overflow: auto; margin-top: 10px; font-size: 11px;">
                    ${JSON.stringify(result, null, 2)}
                    </pre>
                `;
            }
        })
        .catch(error => {
            console.error('Error checking direct access:', error);
            statusDiv.className = 'alert alert-danger mt-2';
            statusDiv.innerHTML = `<strong>Error:</strong> ${error.message}`;
        });
}
