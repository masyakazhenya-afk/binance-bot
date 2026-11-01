# binance-bot

Простий скрипт на Python + [ccxt](https://github.com/ccxt/ccxt), який підключається до Binance,
виводить баланс акаунта та поточну ціну BTC/USDT.

## Запуск

```bash
pip install -r requirements.txt
export BINANCE_API_KEY="ваш_ключ"
export BINANCE_SECRET_KEY="ваш_секрет"
python main.py
```

> Для цього скрипта достатньо API-ключа з правами лише на читання (Read Only).
