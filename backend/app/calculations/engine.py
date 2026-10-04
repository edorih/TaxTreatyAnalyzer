from app.calculations.ftc import summarize_ftc_baskets
from app.calculations.rules import get_country_rule_notes
from app.schemas import ScenarioInputs


def calculate_scenario(inputs: ScenarioInputs) -> dict:
    annual_income = sum(line.monthly_amount_usd * 12 for line in inputs.income_lines)
    basket_summary = summarize_ftc_baskets(inputs.income_lines)
    country_notes = get_country_rule_notes(inputs.destination_country)

    return {
        "tax_year": 2026,
        "annual_income_usd": annual_income,
        "state": {"code": "TX", "estimated_income_tax_usd": 0, "notes": ["Texas has no individual state income tax."]},
        "ftc_baskets": basket_summary,
        "country": country_notes,
        "advisor_flags": [
            "2026 country tax constants and treaty positions require source validation before production use.",
            "Treaty-resourced income, Roth treatment, pensions, and Social Security should be reviewed by a qualified advisor.",
        ],
        "confidence": "draft_foundation",
    }

