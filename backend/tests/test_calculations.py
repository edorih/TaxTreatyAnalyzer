from app.calculations.engine import calculate_scenario
from app.schemas import IncomeLine, ScenarioInputs


def test_calculate_scenario_annualizes_income_and_groups_baskets():
    inputs = ScenarioInputs(
        filing_status="single",
        destination_country="france",
        destination_tax_resident=True,
        deduction_mode="standard",
        income_lines=[
            IncomeLine(
                id="1",
                income_type="401(k)",
                monthly_amount_usd=1000,
                source_country="United States",
                ftc_basket="general",
            ),
            IncomeLine(
                id="2",
                income_type="Dividends",
                monthly_amount_usd=500,
                source_country="United States",
                ftc_basket="passive",
            ),
        ],
    )

    result = calculate_scenario(inputs)

    assert result["annual_income_usd"] == 18000
    assert result["ftc_baskets"]["general"]["annual_income_usd"] == 12000
    assert result["ftc_baskets"]["passive"]["annual_income_usd"] == 6000

