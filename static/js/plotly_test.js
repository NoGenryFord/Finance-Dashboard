/**
 * Тестовий файл для Plotly
 * Цей файл містить тільки код для перевірки, чи працює Plotly правильно
 */

console.log('plotly_test.js loaded');

// Функція для створення тестового графіка
function createTestPlot() {
    console.log('createTestPlot called');
    
    // Перевіряємо наявність бібліотеки Plotly
    if (!window.Plotly) {
        console.error('Plotly is not available!');
        return false;
    }
    
    // Перевіряємо наявність елемента для графіка
    const plotlyTestContainer = document.getElementById('plotly-standalone-test');
    if (!plotlyTestContainer) {
        console.error('Test container not found!');
        return false;
    }
    
    try {
        // Створюємо простий графік
        const data = [{
            x: [1, 2, 3, 4, 5],
            y: [10, 15, 13, 17, 20],
            type: 'scatter',
            mode: 'lines+markers',
            marker: {
                color: 'red',
                size: 8
            },
            line: {
                color: 'blue',
                width: 2
            }
        }];
        
        const layout = {
            title: 'Standalone Plotly Test',
            xaxis: {
                title: 'X Axis'
            },
            yaxis: {
                title: 'Y Axis'
            }
        };
        
        console.log('Calling Plotly.newPlot for standalone test');
        Plotly.newPlot('plotly-standalone-test', data, layout);
        console.log('Standalone test plot created successfully');
        return true;
    } catch (error) {
        console.error('Error creating test plot:', error);
        plotlyTestContainer.innerHTML = `Error: ${error.message}`;
        return false;
    }
}

// Викликаємо функцію створення тестового графіка після завантаження DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM ready in plotly_test.js');
    
    // Створюємо контейнер для тестового графіка
    const container = document.createElement('div');
    container.className = 'container mt-4';
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h5>Standalone Plotly Test</h5>
            </div>
            <div class="card-body">
                <div id="plotly-standalone-test" style="height: 300px;"></div>
            </div>
        </div>
    `;
    
    // Додаємо контейнер на сторінку
    document.body.appendChild(container);
    
    // Створюємо тестовий графік
    setTimeout(function() {
        console.log('Trying to create test plot after delay');
        const result = createTestPlot();
        console.log('Test plot creation result:', result);
    }, 500); // Невелика затримка для впевненості, що DOM повністю завантажений
}); 