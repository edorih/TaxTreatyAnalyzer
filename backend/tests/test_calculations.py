from app.calculations.countries.france import calculate_france_tax, calculate_progressive_tax
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


def test_france_progressive_tax_uses_2026_brackets():
    assert calculate_progressive_tax(11_497) == 0
    assert round(calculate_progressive_tax(29_315), 2) == 1959.98


def test_france_module_separates_income_tax_and_social_charges():
    inputs = ScenarioInputs(
        filing_status="single",
        destination_country="france",
        destination_tax_resident=True,
        deduction_mode="standard",
        income_lines=[
            IncomeLine(
                id="salary",
                income_type="US employer salary",
                monthly_amount_usd=5000,
                source_country="United States",
                ftc_basket="general",
            ),
            IncomeLine(
                id="dividends",
                income_type="Brokerage dividends",
                monthly_amount_usd=1000,
                source_country="United States",
                ftc_basket="passive",
            ),
            IncomeLine(
                id="ssa",
                income_type="Social Security",
                monthly_amount_usd=2000,
                source_country="United States",
                ftc_basket="general",
            ),
        ],
    )

    result = calculate_france_tax(inputs).to_dict()

    assert result["country"] == "france"
    assert result["total_taxable_income_usd"] == 72000
    assert result["estimated_social_charges_usd"] == 2232
    assert result["social_charge_breakdown"] == [
        {"code": "csg", "label": "CSG", "rate": 0.106, "amount_usd": 1272.0, "notes": ["Applied to income lines mapped to French social charges in v1."]},
        {"code": "crds", "label": "CRDS", "rate": 0.005, "amount_usd": 60.0, "notes": ["Applied to income lines mapped to French social charges in v1."]},
        {
            "code": "solidarity_levy",
            "label": "Prelevement de solidarite",
            "rate": 0.075,
            "amount_usd": 900.0,
            "notes": ["Applied to income lines mapped to French social charges in v1."],
        },
    ]
    social_security = next(
        treatment for treatment in result["income_treatments"] if treatment["income_line_id"] == "ssa"
    )
    assert social_security["france_taxable_amount_usd"] == 0
    assert social_security["treaty_position"] == "us_social_security_paying_state_only"
