import yfinance as yf
import pandas as pd

#Try to get data for Apple
print("Спроба отримати дані для AAPL (Apple)...")
data = yf.download("AAPL", period="1mo")
print(f"Отримано {len(data)} записів")
print(data.head())

# Try to get data for non-existent symbol
print("\nTry to get data for non-existent symbol...")
data_fake = yf.download("FAKESYMBOL123", period="1mo")
print(f"Received {len(data_fake)} records")
print(data_fake.head()) 