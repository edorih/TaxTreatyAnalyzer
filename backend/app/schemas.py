from typing import Literal

from pydantic import BaseModel, EmailStr, Field

DestinationCountry = Literal["france", "italy", "portugal"]
FilingStatus = Literal[
    "single",
    "married_filing_jointly",
    "married_filing_separately",
    "head_of_household",
]
UsStateCode = Literal[
    "AL",
    "AK",
    "AZ",
    "AR",
    "CA",
    "CO",
    "CT",
    "DE",
    "FL",
    "GA",
    "HI",
    "ID",
    "IL",
    "IN",
    "IA",
    "KS",
    "KY",
    "LA",
    "ME",
    "MD",
    "MA",
    "MI",
    "MN",
    "MS",
    "MO",
    "MT",
    "NE",
    "NV",
    "NH",
    "NJ",
    "NM",
    "NY",
    "NC",
    "ND",
    "OH",
    "OK",
    "OR",
    "PA",
    "RI",
    "SC",
    "SD",
    "TN",
    "TX",
    "UT",
    "VT",
    "VA",
    "WA",
    "WV",
    "WI",
    "WY",
]
FtcBasket = Literal[
    "passive",
    "general",
    "treaty_resourced",
    "foreign_branch",
    "gilti_951a",
    "lump_sum",
    "not_applicable",
    "unknown",
]
FranceVisaStatus = Literal[
    "visitor_retiree",
    "employee",
    "self_employed",
    "talent_professional",
    "student",
    "other_unsure",
]
FranceHealthAffiliation = Literal[
    "unknown",
    "french_system",
    "us_totalization_or_private",
    "not_affiliated",
]


class AuthRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=10, max_length=256)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class IncomeLine(BaseModel):
    id: str
    income_type: str
    monthly_amount_usd: float = Field(ge=0)
    source_country: str
    ftc_basket: FtcBasket = "unknown"
    destination_taxable: bool | None = None
    notes: str | None = None


class DeductionLine(BaseModel):
    id: str
    deduction_type: str
    annual_amount_usd: float = Field(ge=0)
    notes: str | None = None


class ScenarioInputs(BaseModel):
    filing_status: FilingStatus
    us_state: UsStateCode = "TX"
    destination_country: DestinationCountry
    destination_tax_resident: bool
    france_household_parts: float = Field(default=1, ge=1, le=20)
    usd_per_eur: float = Field(default=1.15, gt=0)
    france_visa_status: FranceVisaStatus = "visitor_retiree"
    will_work_in_france: bool = False
    france_health_affiliation: FranceHealthAffiliation = "unknown"
    deduction_mode: Literal["standard", "itemized"]
    income_lines: list[IncomeLine]
    deduction_lines: list[DeductionLine] = []


class ScenarioCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    inputs: ScenarioInputs


class ScenarioRead(BaseModel):
    id: str
    name: str
    destination_country: DestinationCountry
    tax_year: int
    inputs: ScenarioInputs
    calculation_snapshot: dict
