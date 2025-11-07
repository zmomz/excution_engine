import ccxt

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
    except (ccxt.base.errors.ExchangeNotFound, ccxt.base.errors.BadSymbol):
        return None

def validate_precision(value, precision):
    if precision is None:
        return False
    # The number of decimal places is the negative log10 of the precision
    # For example, a precision of 0.01 means 2 decimal places
    # A precision of 1 means 0 decimal places
    import math
    decimal_places = -int(math.log10(precision)) if precision > 0 else 0
    
    # Check if the value has more decimal places than allowed
    value_str = str(value)
    if "." in value_str:
        return len(value_str.split(".")[1]) <= decimal_places
    return True