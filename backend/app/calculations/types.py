from dataclasses import asdict, dataclass, field


@dataclass(frozen=True)
class SourceReference:
    label: str
    url: str
    notes: str

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass(frozen=True)
class AdvisorFlag:
    code: str
    severity: str
    message: str
    income_line_id: str | None = None

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass(frozen=True)
class TaxComponent:
    code: str
    label: str
    amount_usd: float
    confidence: str
    notes: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass(frozen=True)
class IncomeTreatment:
    income_line_id: str
    income_type: str
    annual_amount_usd: float
    france_taxable_amount_usd: float
    france_income_tax_usd: float
    france_social_charges_usd: float
    treaty_position: str
    ftc_basket: str
    confidence: str
    notes: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass(frozen=True)
class CountryTaxResult:
    country: str
    tax_year: int
    total_taxable_income_usd: float
    estimated_income_tax_usd: float
    estimated_social_charges_usd: float
    components: list[TaxComponent]
    income_treatments: list[IncomeTreatment]
    advisor_flags: list[AdvisorFlag]
    sources: list[SourceReference]
    assumptions: list[str]
    confidence: str

    def to_dict(self) -> dict:
        return {
            "country": self.country,
            "tax_year": self.tax_year,
            "total_taxable_income_usd": self.total_taxable_income_usd,
            "estimated_income_tax_usd": self.estimated_income_tax_usd,
            "estimated_social_charges_usd": self.estimated_social_charges_usd,
            "components": [component.to_dict() for component in self.components],
            "income_treatments": [treatment.to_dict() for treatment in self.income_treatments],
            "advisor_flags": [flag.to_dict() for flag in self.advisor_flags],
            "sources": [source.to_dict() for source in self.sources],
            "assumptions": self.assumptions,
            "confidence": self.confidence,
        }

