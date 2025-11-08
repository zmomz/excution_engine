import ccxt
from ccxt.base import errors
import math

def get_precision_rules(exchange_name: str, symbol: str):
    try:
        exchange_class = getattr(ccxt, exchange_name.lower())
        exchange = exchange_class()
        markets = exchange.load_markets()
        market = markets.get(symbol)
        if not market:
            return None
        return {
            "price": market["precision"]["price"],
            "amount": market["precision"]["amount"],
        }
    except (errors.ExchangeError, errors.BadSymbol):
        return None

def validate_precision(value, precision):
    if precision is None:
        return False
    decimal_places = -int(math.log10(precision)) if precision > 0 else 0
    value_str = str(value)
    if "." in value_str:
        return len(value_str.split(".")[1]) <= decimal_places
    return True

def get_current_price(exchange_name: str, symbol: str) -> float | None:
    try:
        exchange_class = getattr(ccxt, exchange_name.lower())
        exchange = exchange_class()
        ticker = exchange.fetch_ticker(symbol)
        return ticker["last"]
    except (errors.ExchangeError, errors.BadSymbol):
        return None