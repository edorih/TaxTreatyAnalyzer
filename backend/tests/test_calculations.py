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
    assert result["state"]["code"] == "TX"
    assert result["state"]["estimated_income_tax_usd"] == 0
    assert result["ftc_baskets"]["general"]["annual_income_usd"] == 12000
    assert result["ftc_baskets"]["passive"]["annual_income_usd"] == 6000


def test_calculate_scenario_flags_unmodeled_states():
    inputs = ScenarioInputs(
        filing_status="single",
        us_state="CA",
        destination_country="france",
        destination_tax_resident=True,
        deduction_mode="standard",
        income_lines=[
            IncomeLine(
                id="salary",
                income_type="US employer salary",
                monthly_amount_usd=1000,
                source_country="United States",
                ftc_basket="general",
            )
        ],
    )

    result = calculate_scenario(inputs)

    assert result["state"]["code"] == "CA"
    assert result["state"]["estimated_income_tax_usd"] is None
    assert "not modeled yet" in result["state"]["notes"][0]


def test_france_progressive_tax_uses_2026_brackets():
    assert calculate_progressive_tax(11_497) == 0
    assert round(calculate_progressive_tax(29_315), 2) == 1959.98


def test_france_progressive_tax_uses_household_parts():
    single_part_tax = calculate_progressive_tax(60_000, parts=1)
    two_part_tax = calculate_progressive_tax(60_000, parts=2)

    assert two_part_tax < single_part_tax
    assert round(two_part_tax, 2) == 4330.96


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
    assert result["france_household_parts"] == 1
    assert result["total_taxable_income_usd"] == 72000
    assert result["estimated_social_charges_usd"] == 2232
    assert sum(row["annual_amount_usd"] for row in result["income_tax_rows"]) == 96000
    assert sum(row["france_taxable_amount_usd"] for row in result["income_tax_rows"]) == 72000
    assert round(sum(row["france_income_tax_usd"] for row in result["income_tax_rows"]), 2) == result[
        "estimated_income_tax_usd"
    ]
    assert round(sum(row["france_social_charges_usd"] for row in result["income_tax_rows"]), 2) == result[
        "estimated_social_charges_usd"
    ]
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


def test_france_module_applies_user_supplied_household_parts():
    inputs = ScenarioInputs(
        filing_status="married_filing_jointly",
        destination_country="france",
        destination_tax_resident=True,
        france_household_parts=2,
        deduction_mode="standard",
        income_lines=[
            IncomeLine(
                id="salary",
                income_type="US employer salary",
                monthly_amount_usd=5000,
                source_country="United States",
                ftc_basket="general",
            )
        ],
    )

    result = calculate_france_tax(inputs).to_dict()

    assert result["france_household_parts"] == 2
    assert result["estimated_income_tax_usd"] == 3691.26


def test_france_module_uses_user_supplied_exchange_rate_for_progressive_tax():
    inputs = ScenarioInputs(
        filing_status="married_filing_jointly",
        destination_country="france",
        destination_tax_resident=True,
        france_household_parts=2,
        usd_per_eur=1,
        deduction_mode="standard",
        income_lines=[
            IncomeLine(
                id="salary",
                income_type="US employer salary",
                monthly_amount_usd=5000,
                source_country="United States",
                ftc_basket="general",
            )
        ],
    )

    result = calculate_france_tax(inputs).to_dict()

    assert result["estimated_income_tax_usd"] == 4330.96
