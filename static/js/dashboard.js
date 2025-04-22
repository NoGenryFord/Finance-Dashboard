document.addEventListener('DOMContentLoaded', function() {
    // Initial load
    loadStockData();
    
    // Add event listener for the update button
    document.getElementById('updateChart').addEventListener('click', loadStockData);
});

function loadStockData() {
    const symbol = document.getElementById('stockSymbol').value || 'AAPL';
    const period = document.getElementById('timePeriod').value || '1mo';
    
    // Show loading state
    document.getElementById('stockChart').innerHTML = 'Loading data...';
    
    // Fetch stock data from our API
    fetch(`/api/stock-data?symbol=${symbol}&period=${period}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.length === 0) {
                document.getElementById('stockChart').innerHTML = 'No data available for this symbol';
                return;
            }
            
            // Update the charts and metrics
            createStockChart(data, symbol);
            createTrendChart(data);
            updatePerformanceMetrics(data);
        })
        .catch(error => {
            console.error('Error fetching stock data:', error);
            document.getElementById('stockChart').innerHTML = 'Error loading data. Please try again.';
        });
        
    // For demonstration, add some market summary data
    updateMarketSummary(symbol);
}

function createStockChart(data, symbol) {
    // Prepare data for Plotly
    const dates = data.map(item => item.Date);
    const closePrices = data.map(item => item.Close);
    const openPrices = data.map(item => item.Open);
    const highPrices = data.map(item => item.High);
    const lowPrices = data.map(item => item.Low);
    
    // Create a candlestick chart
    const trace = {
        x: dates,
        close: closePrices,
        high: highPrices,
        low: lowPrices,
        open: openPrices,
        type: 'candlestick',
        xaxis: 'x',
        yaxis: 'y',
        increasing: {line: {color: '#26a69a'}},
        decreasing: {line: {color: '#ef5350'}}
    };
    
    const layout = {
        title: `${symbol} Stock Price`,
        xaxis: {
            title: 'Date',
            rangeslider: {visible: false}
        },
        yaxis: {
            title: 'Price'
        }
    };
    
    Plotly.newPlot('stockChart', [trace], layout);
}

function createTrendChart(data) {
    // Simple line chart showing the closing price trend
    const dates = data.map(item => item.Date);
    const closePrices = data.map(item => item.Close);
    
    const trace = {
        x: dates,
        y: closePrices,
        type: 'scatter',
        mode: 'lines',
        line: {
            color: '#17BECF',
            width: 2
        }
    };
    
    const layout = {
        title: 'Closing Price Trend',
        xaxis: {
            title: 'Date'
        },
        yaxis: {
            title: 'Price'
        }
    };
    
    Plotly.newPlot('trendChart', [trace], layout);
}

function updatePerformanceMetrics(data) {
    // Get the most recent data point
    const latestData = data[data.length - 1];
    
    // Update the metrics in the table
    document.getElementById('openingPrice').textContent = '$' + latestData.Open.toFixed(2);
    document.getElementById('closingPrice').textContent = '$' + latestData.Close.toFixed(2);
    document.getElementById('highPrice').textContent = '$' + latestData.High.toFixed(2);
    document.getElementById('lowPrice').textContent = '$' + latestData.Low.toFixed(2);
    document.getElementById('volume').textContent = latestData.Volume.toLocaleString();
}

function updateMarketSummary(symbol) {
    // In a real application, you would fetch this data from an API
    // For demonstration, we'll use placeholder data
    const marketSummary = document.getElementById('marketSummary');
    
    // Generate a random change percentage between -2% and +2%
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
}
