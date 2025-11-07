def validate_precision(value: float, expected_precision: int) -> bool:
    if not isinstance(value, (int, float)):
        return False
    
    # Convert to string to check decimal places
    s_value = str(value)
    if '.' in s_value:
        decimal_part = s_value.split('.')[1]
        return len(decimal_part) <= expected_precision
    return True

# Example precision rules (can be loaded from config or DB)
PRECISION_RULES = {
    "trade_price": 2,
    "trade_quantity": 4,
    "order_amount": 6,
}
