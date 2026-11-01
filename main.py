"""Простий скрипт: підключення до Binance через ccxt,
перевірка балансу акаунта та виведення поточної ціни BTC/USDT.

Потрібні змінні оточення:
    BINANCE_API_KEY
    BINANCE_SECRET_KEY
"""

import os
import sys

import ccxt

SYMBOL = "BTC/USDT"


def create_exchange() -> ccxt.binance:
    api_key = os.getenv("BINANCE_API_KEY")
    secret = os.getenv("BINANCE_SECRET_KEY")

    if not api_key or not secret:
        sys.exit(
            "Помилка: задайте змінні оточення BINANCE_API_KEY та BINANCE_SECRET_KEY."
        )

    return ccxt.binance(
        {
            "apiKey": api_key,
            "secret": secret,
            "enableRateLimit": True,
            "options": {"defaultType": "spot"},
        }
    )


def print_balance(exchange: ccxt.binance) -> None:
    balance = exchange.fetch_balance()
    totals = {
        currency: amount
        for currency, amount in balance.get("total", {}).items()
        if amount  # пропускаємо нульові та None
    }

    print("=== Баланс акаунта ===")
    if not totals:
        print("На акаунті немає ненульових балансів.")
        return

    for currency, amount in sorted(totals.items()):
        free = balance.get(currency, {}).get("free") or 0
        used = balance.get(currency, {}).get("used") or 0
        print(f"{currency:>8}: всього {amount} (вільно {free}, у ордерах {used})")


def print_price(exchange: ccxt.binance, symbol: str = SYMBOL) -> None:
    ticker = exchange.fetch_ticker(symbol)
    print(f"\n=== Поточна ціна {symbol} ===")
    print(f"{ticker['last']} USDT")


def main() -> None:
    exchange = create_exchange()

    try:
        print_balance(exchange)
        print_price(exchange)
    except ccxt.AuthenticationError as e:
        sys.exit(f"Помилка автентифікації (перевірте ключі API): {e}")
    except ccxt.NetworkError as e:
        sys.exit(f"Мережева помилка: {e}")
    except ccxt.ExchangeError as e:
        sys.exit(f"Помилка біржі: {e}")


if __name__ == "__main__":
    main()
