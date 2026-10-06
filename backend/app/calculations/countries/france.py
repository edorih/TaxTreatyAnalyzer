from app.calculations.types import (
    AdvisorFlag,
    CountryTaxResult,
    IncomeTaxRow,
    IncomeTreatment,
    RateComponent,
    SourceReference,
    TaxComponent,
)
from app.schemas import IncomeLine, ScenarioInputs

FRANCE_PROGRESSIVE_BRACKETS_2026_REVENUS_2025 = [
    (11_497, 0.00),
    (29_315, 0.11),
    (83_823, 0.30),
    (180_294, 0.41),
    (float("inf"), 0.45),
]

FRANCE_INVESTMENT_INCOME_TAX_RATE = 0.128
FRANCE_INVESTMENT_SOCIAL_CHARGE_RATE_2026 = 0.186
FRANCE_SOCIAL_CHARGE_COMPONENT_RATES_2026 = {
    "csg": ("CSG", 0.106),
    "crds": ("CRDS", 0.005),
    "solidarity_levy": ("Prelevement de solidarite", 0.075),
}

FRANCE_SOURCES = [
    SourceReference(
        label="impots.gouv.fr - 2026 progressive income tax brackets",
        url="https://www.impots.gouv.fr/particulier/questions/comment-calculer-mon-taux-dimposition-dapres-le-bareme-progressif-de-limpot",
        notes="Published French progressive income tax brackets shown for 2026 tax on 2025 income.",
    ),
    SourceReference(
        label="impots.gouv.fr - rental social charges",
        url="https://www.impots.gouv.fr/particulier/questions/je-donne-un-bien-en-location-dois-je-payer-des-prelevements-sociaux",
        notes="French social charges on rental income, including component rates for furnished rental income in 2026.",
    ),
    SourceReference(
        label="impots.gouv.fr - investment income and social charges",
        url="https://www.impots.gouv.fr/particulier/les-revenus-mobiliers",
        notes="French PFU and social-charge notes for investment income, including 12.8% income tax and 2026 social-charge context.",
    ),
    SourceReference(
        label="IRS - France tax treaty documents",
        url="https://www.irs.gov/businesses/international-businesses/france-tax-treaty-documents",
        notes="IRS index for the US-France income tax treaty, protocols, and technical explanations.",
    ),
    SourceReference(
        label="US Treasury technical explanation - US-France treaty Article 18",
        url="https://www.irs.gov/pub/irs-trty/francetech.pdf",
        notes="Technical explanation describes private pension residence-state taxation and paying-state social security treatment.",
    ),
]


def calculate_france_tax(inputs: ScenarioInputs) -> CountryTaxResult:
    treatments: list[IncomeTreatment] = []
    household_parts = inputs.france_household_parts
    flags: list[AdvisorFlag] = [
        AdvisorFlag(
            code="fx_assumption",
            severity="medium",
            message="France brackets are EUR-denominated; v1 assumes 1 USD = 1 EUR until an exchange-rate model is added.",
        ),
        AdvisorFlag(
            code="france_2026_income_year_gap",
            severity="medium",
            message="France 2026 income-year rules may not be final; v1 uses the currently published 2026 schedule for 2025 income as a placeholder.",
        ),
    ]

    for line in inputs.income_lines:
        treatment, line_flags = classify_income_line(line, inputs.destination_tax_resident)
        treatments.append(treatment)
        flags.extend(line_flags)

    progressive_base = sum(
        treatment.france_taxable_amount_usd
        for treatment in treatments
        if treatment.treaty_position in {"france_residence_taxable_progressive", "france_taxable_uncertain_progressive"}
    )
    progressive_tax = calculate_progressive_tax(progressive_base, household_parts)
    flat_income_tax = sum(
        treatment.france_income_tax_usd
        for treatment in treatments
        if treatment.treaty_position == "france_taxable_flat_investment"
    )
    social_charge_base = sum(
        treatment.france_taxable_amount_usd
        for treatment in treatments
        if treatment.france_social_charges_usd > 0
    )
    social_charge_breakdown = calculate_social_charge_breakdown(social_charge_base)
    social_charges = sum(component.amount_usd for component in social_charge_breakdown)
    total_income_tax = progressive_tax + flat_income_tax
    taxable_income = sum(treatment.france_taxable_amount_usd for treatment in treatments)
    income_tax_rows = build_income_tax_rows(treatments, progressive_base, progressive_tax)

    components = [
        TaxComponent(
            code="fr_income_tax_progressive",
            label="France progressive income tax",
            amount_usd=round(progressive_tax, 2),
            confidence="medium",
            notes=[
                "Applied to employment, pension-like, and other progressively taxed income classified as France-taxable.",
                f"Uses {household_parts:g} French tax household part(s) for quotient familial.",
            ],
        ),
        TaxComponent(
            code="fr_income_tax_flat_investment",
            label="France flat investment income tax",
            amount_usd=round(flat_income_tax, 2),
            confidence="medium",
            notes=["Applies a 12.8% PFU-style income-tax estimate to supported investment income types."],
        ),
        TaxComponent(
            code="fr_social_charges",
            label="France social charges",
            amount_usd=round(social_charges, 2),
            confidence="low",
            notes=["Social charges are separated from income tax and vary by income type, affiliation, and regime."],
        ),
    ]

    return CountryTaxResult(
        country="france",
        tax_year=2026,
        france_household_parts=household_parts,
        total_taxable_income_usd=round(taxable_income, 2),
        estimated_income_tax_usd=round(total_income_tax, 2),
        estimated_social_charges_usd=round(social_charges, 2),
        components=components,
        social_charge_breakdown=social_charge_breakdown,
        income_treatments=treatments,
        income_tax_rows=income_tax_rows,
        advisor_flags=flags,
        sources=FRANCE_SOURCES,
        assumptions=[
            "User is a US citizen and France tax resident for the scenario.",
            "Inputs are monthly USD amounts annualized by multiplying by 12.",
            f"France progressive tax uses {household_parts:g} household part(s) supplied by the user.",
            "The first France module estimates broad treatment only; it is not a filing calculator.",
        ],
        confidence="draft_country_module",
    )


def classify_income_line(line: IncomeLine, france_tax_resident: bool) -> tuple[IncomeTreatment, list[AdvisorFlag]]:
    annual_amount = line.monthly_amount_usd * 12
    normalized_type = normalize_income_type(line.income_type)
    flags: list[AdvisorFlag] = []

    if not france_tax_resident:
        flags.append(
            AdvisorFlag(
                code="nonresident_france_scope",
                severity="high",
                message="France nonresident taxation is not modeled yet.",
                income_line_id=line.id,
            )
        )
        return income_treatment(line, annual_amount, 0, 0, 0, "france_nonresident_not_modeled", "unknown", "low"), flags

    if normalized_type in {"us_employer_salary", "local_employer_salary", "self_employment"}:
        flags.append(
            AdvisorFlag(
                code="france_work_social_contributions_not_modeled",
                severity="high",
                message="French payroll/self-employment social contributions are not modeled yet.",
                income_line_id=line.id,
            )
        )
        return income_treatment(
            line,
            annual_amount,
            annual_amount,
            0,
            0,
            "france_residence_taxable_progressive",
            "general",
            "medium",
        ), flags

    if normalized_type in {"401k", "traditional_ira", "pension", "annuity"}:
        flags.append(
            AdvisorFlag(
                code="france_pension_account_review",
                severity="medium",
                message="Private pension and retirement-account treatment should be reviewed against the treaty and account facts.",
                income_line_id=line.id,
            )
        )
        return income_treatment(
            line,
            annual_amount,
            annual_amount,
            0,
            0,
            "france_residence_taxable_progressive",
            "general",
            "medium",
        ), flags

    if normalized_type == "roth_ira":
        flags.append(
            AdvisorFlag(
                code="france_roth_ira_review",
                severity="high",
                message="Roth IRA treatment is fact-sensitive; v1 does not automatically treat distributions as tax-free in France.",
                income_line_id=line.id,
            )
        )
        return income_treatment(
            line,
            annual_amount,
            annual_amount,
            0,
            0,
            "france_taxable_uncertain_progressive",
            "general",
            "low",
            ["Included in progressive base as conservative placeholder."],
        ), flags

    if normalized_type == "social_security":
        return income_treatment(
            line,
            annual_amount,
            0,
            0,
            0,
            "us_social_security_paying_state_only",
            "general",
            "medium",
            ["US Social Security is treated as not France-taxable in v1 based on treaty technical explanation."],
        ), flags

    if normalized_type in {"brokerage_dividends", "interest", "long_term_capital_gains", "short_term_capital_gains", "crypto_gains"}:
        income_tax = annual_amount * FRANCE_INVESTMENT_INCOME_TAX_RATE
        social_charges = annual_amount * FRANCE_INVESTMENT_SOCIAL_CHARGE_RATE_2026
        return income_treatment(
            line,
            annual_amount,
            annual_amount,
            income_tax,
            social_charges,
            "france_taxable_flat_investment",
            "passive",
            "medium",
            ["Uses PFU-style 12.8% income tax and 18.6% social-charge placeholder for supported investment income."],
        ), flags

    if normalized_type == "rental_income":
        flags.append(
            AdvisorFlag(
                code="france_rental_regime_review",
                severity="medium",
                message="Rental treatment depends on property location, furnished/unfurnished status, and micro vs actual regime.",
                income_line_id=line.id,
            )
        )
        social_charges = annual_amount * FRANCE_INVESTMENT_SOCIAL_CHARGE_RATE_2026
        return income_treatment(
            line,
            annual_amount,
            annual_amount,
            0,
            social_charges,
            "france_residence_taxable_progressive",
            "passive",
            "low",
            ["Uses 2026 CSG, CRDS, and solidarity levy components as a conservative placeholder."],
        ), flags

    if normalized_type == "qualified_529_withdrawal_for_child":
        flags.append(
            AdvisorFlag(
                code="france_529_qualified_child_assumption",
                severity="medium",
                message="Qualified 529 child-beneficiary withdrawals are modeled as not taxable income in v1; confirm beneficiary and qualified-use facts.",
                income_line_id=line.id,
            )
        )
        return income_treatment(line, annual_amount, 0, 0, 0, "qualified_529_child_not_taxable_v1", "not_applicable", "medium"), flags

    flags.append(
        AdvisorFlag(
            code="france_income_type_unknown",
            severity="medium",
            message=f"France treatment is not mapped for income type: {line.income_type}.",
            income_line_id=line.id,
        )
    )
    return income_treatment(line, annual_amount, 0, 0, 0, "france_taxability_unknown", "unknown", "low"), flags


def calculate_progressive_tax(taxable_income: float, parts: float = 1.0) -> float:
    if taxable_income <= 0:
        return 0

    taxable_per_part = taxable_income / parts
    tax_per_part = 0.0
    previous_threshold = 0.0

    for threshold, rate in FRANCE_PROGRESSIVE_BRACKETS_2026_REVENUS_2025:
        if taxable_per_part <= previous_threshold:
            break
        tranche_amount = min(taxable_per_part, threshold) - previous_threshold
        tax_per_part += max(tranche_amount, 0) * rate
        previous_threshold = threshold

    return tax_per_part * parts


def calculate_social_charge_breakdown(taxable_base: float) -> list[RateComponent]:
    return [
        RateComponent(
            code=code,
            label=label,
            rate=rate,
            amount_usd=round(taxable_base * rate, 2),
            notes=["Applied to income lines mapped to French social charges in v1."],
        )
        for code, (label, rate) in FRANCE_SOCIAL_CHARGE_COMPONENT_RATES_2026.items()
    ]


def build_income_tax_rows(
    treatments: list[IncomeTreatment],
    progressive_base: float,
    progressive_tax: float,
) -> list[IncomeTaxRow]:
    rows: list[IncomeTaxRow] = []
    for treatment in treatments:
        income_tax = treatment.france_income_tax_usd
        notes = list(treatment.notes)
        if treatment.treaty_position in {"france_residence_taxable_progressive", "france_taxable_uncertain_progressive"}:
            income_tax = allocate_progressive_tax(
                treatment.france_taxable_amount_usd,
                progressive_base,
                progressive_tax,
            )
            notes.append("Progressive French tax allocated proportionally across progressively taxed income lines.")

        rows.append(
            IncomeTaxRow(
                income_line_id=treatment.income_line_id,
                income_type=treatment.income_type,
                annual_amount_usd=treatment.annual_amount_usd,
                france_taxable_amount_usd=treatment.france_taxable_amount_usd,
                france_income_tax_usd=round(income_tax, 2),
                france_social_charges_usd=treatment.france_social_charges_usd,
                notes=notes,
            )
        )
    return rows


def allocate_progressive_tax(taxable_amount: float, progressive_base: float, progressive_tax: float) -> float:
    if taxable_amount <= 0 or progressive_base <= 0 or progressive_tax <= 0:
        return 0
    return progressive_tax * (taxable_amount / progressive_base)


def income_treatment(
    line: IncomeLine,
    annual_amount: float,
    taxable_amount: float,
    income_tax: float,
    social_charges: float,
    treaty_position: str,
    ftc_basket: str,
    confidence: str,
    notes: list[str] | None = None,
) -> IncomeTreatment:
    return IncomeTreatment(
        income_line_id=line.id,
        income_type=line.income_type,
        annual_amount_usd=round(annual_amount, 2),
        france_taxable_amount_usd=round(taxable_amount, 2),
        france_income_tax_usd=round(income_tax, 2),
        france_social_charges_usd=round(social_charges, 2),
        treaty_position=treaty_position,
        ftc_basket=ftc_basket,
        confidence=confidence,
        notes=notes or [],
    )


def normalize_income_type(income_type: str) -> str:
    return (
        income_type.lower()
        .replace(" ", "_")
        .replace("-", "_")
        .replace("/", "_")
        .replace("(", "")
        .replace(")", "")
    )
