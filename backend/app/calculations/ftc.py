from app.schemas import IncomeLine


def summarize_ftc_baskets(income_lines: list[IncomeLine]) -> dict:
    baskets: dict[str, dict[str, float]] = {}
    for line in income_lines:
        basket = line.ftc_basket
        if basket not in baskets:
            baskets[basket] = {"annual_income_usd": 0}
        baskets[basket]["annual_income_usd"] += line.monthly_amount_usd * 12
    return baskets

