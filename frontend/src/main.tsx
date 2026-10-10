import React from "react";
import ReactDOM from "react-dom/client";
import { ArrowLeft, Calculator, Check, Plus, ShieldCheck } from "lucide-react";
import "./styles.css";

type DestinationCountry = "france" | "italy" | "portugal";
type FtcBasket = "passive" | "general" | "treaty_resourced" | "not_applicable" | "unknown";
type FilingStatus = "single" | "married_filing_jointly" | "married_filing_separately" | "head_of_household";
type UsStateCode =
  | "AL"
  | "AK"
  | "AZ"
  | "AR"
  | "CA"
  | "CO"
  | "CT"
  | "DE"
  | "FL"
  | "GA"
  | "HI"
  | "ID"
  | "IL"
  | "IN"
  | "IA"
  | "KS"
  | "KY"
  | "LA"
  | "ME"
  | "MD"
  | "MA"
  | "MI"
  | "MN"
  | "MS"
  | "MO"
  | "MT"
  | "NE"
  | "NV"
  | "NH"
  | "NJ"
  | "NM"
  | "NY"
  | "NC"
  | "ND"
  | "OH"
  | "OK"
  | "OR"
  | "PA"
  | "RI"
  | "SC"
  | "SD"
  | "TN"
  | "TX"
  | "UT"
  | "VT"
  | "VA"
  | "WA"
  | "WV"
  | "WI"
  | "WY";
type FranceVisaStatus = "visitor_retiree" | "employee" | "self_employed" | "talent_professional" | "student" | "other_unsure";
type FranceHealthAffiliation = "unknown" | "french_system" | "us_totalization_or_private" | "not_affiliated";
type FranceTaxResidencyStatus = "resident" | "not_resident";
type AppStep = "modules" | "analyzer" | "optimizer" | "inputs" | "results";

type IncomeLine = {
  id: string;
  incomeType: string;
  monthlyAmountUsd: number;
  sourceCountry: string;
  ftcBasket: FtcBasket;
};

type IncomeTaxRow = {
  income_line_id: string;
  income_type: string;
  annual_amount_usd: number;
  france_taxable_amount_usd: number;
  france_income_tax_usd: number;
  france_social_charges_usd: number;
  notes: string[];
};

type IncomeTreatment = IncomeTaxRow & {
  treaty_position?: string;
  ftc_basket?: string;
  confidence?: string;
};

type CountryTaxResult = {
  france_household_parts?: number;
  estimated_income_tax_usd?: number;
  estimated_social_charges_usd?: number;
  total_taxable_income_usd?: number;
  income_tax_rows?: IncomeTaxRow[];
  income_treatments?: IncomeTreatment[];
  advisor_flags?: Array<{ code: string; severity: string; message: string; income_line_id?: string | null }>;
  social_charge_breakdown?: Array<{ code: string; label: string; rate: number; amount_usd: number }>;
  sources?: Array<{ label: string; url: string; notes: string }>;
  assumptions?: string[];
};

type CalculationSnapshot = {
  annual_income_usd: number;
  country_tax: CountryTaxResult;
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";
const appStateStorageKey = "know-thy-taxes-estimator-state";

const incomeTypes = [
  "US employer salary",
  "Local employer salary",
  "Self-employment",
  "401(k)",
  "Traditional IRA",
  "Roth IRA",
  "Pension",
  "Social Security",
  "Brokerage dividends",
  "Long-term capital gains",
  "Rental income",
  "Qualified 529 withdrawal for child"
];

const defaultFtcBasketByIncomeType: Record<string, FtcBasket> = {
  "US employer salary": "general",
  "Local employer salary": "general",
  "Self-employment": "general",
  "401(k)": "general",
  "Traditional IRA": "general",
  "Roth IRA": "general",
  Pension: "general",
  "Social Security": "general",
  "Brokerage dividends": "passive",
  "Long-term capital gains": "passive",
  "Rental income": "passive",
  "Qualified 529 withdrawal for child": "not_applicable"
};

const usStates: Array<{ code: UsStateCode; name: string }> = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" }
];

const socialChargeColumns = [
  { key: "csg", label: "CSG", rate: 0.106 },
  { key: "crds", label: "CRDS", rate: 0.005 },
  { key: "social_levy", label: "Prelevement social", rate: 0 },
  { key: "additional_contribution", label: "Contribution additionnelle", rate: 0 },
  { key: "solidarity_levy", label: "Prelevement de solidarite", rate: 0.075 }
];

const modeledSocialChargeRate = socialChargeColumns.reduce((sum, column) => sum + column.rate, 0);

const initialLines: IncomeLine[] = incomeTypes.map((incomeType, index) => ({
  id: `income-${index + 1}`,
  incomeType,
  monthlyAmountUsd: 1000,
  sourceCountry: incomeType === "Local employer salary" ? "France" : "United States",
  ftcBasket: defaultFtcBasketByIncomeType[incomeType] ?? "unknown"
}));

function formatUsd(value: number | undefined): string {
  if (value === undefined || Number.isNaN(value)) {
    return "Pending";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function getIncomeRows(countryTax: CountryTaxResult): IncomeTaxRow[] {
  if (countryTax.income_tax_rows && countryTax.income_tax_rows.length > 0) {
    return countryTax.income_tax_rows;
  }

  return (countryTax.income_treatments ?? []).map((treatment) => ({
    income_line_id: treatment.income_line_id,
    income_type: treatment.income_type,
    annual_amount_usd: treatment.annual_amount_usd,
    france_taxable_amount_usd: treatment.france_taxable_amount_usd,
    france_income_tax_usd: treatment.france_income_tax_usd,
    france_social_charges_usd: treatment.france_social_charges_usd,
    notes: treatment.notes ?? []
  }));
}

function socialChargeComponentAmount(row: IncomeTaxRow, rate: number): number | null {
  if (row.france_social_charges_usd <= 0 || rate <= 0 || modeledSocialChargeRate <= 0) {
    return null;
  }

  return row.france_social_charges_usd * (rate / modeledSocialChargeRate);
}

function formatSocialChargeCell(row: IncomeTaxRow, rate: number): string {
  const amount = socialChargeComponentAmount(row, rate);
  return amount === null ? "N/A" : formatUsd(amount);
}

function advisorSeverityRank(severity: string): number {
  const normalizedSeverity = severity.toLowerCase();
  if (normalizedSeverity === "high") {
    return 3;
  }
  if (normalizedSeverity === "medium") {
    return 2;
  }
  if (normalizedSeverity === "low") {
    return 1;
  }
  return 0;
}

function getReviewSubject(
  flag: { income_line_id?: string | null },
  incomeRows: IncomeTaxRow[]
): string {
  if (!flag.income_line_id) {
    return "Scenario review";
  }

  const incomeRow = incomeRows.find((row) => row.income_line_id === flag.income_line_id);
  return incomeRow ? `Income line: ${incomeRow.income_type}` : "Income line review";
}

function isAppStep(value: unknown): value is AppStep {
  return value === "modules" || value === "analyzer" || value === "optimizer" || value === "inputs" || value === "results";
}

function stepFromPath(pathname: string): AppStep {
  if (pathname === "/estimate/results") {
    return "results";
  }
  if (pathname === "/estimate/inputs") {
    return "inputs";
  }
  if (pathname === "/estimate") {
    return "analyzer";
  }
  if (pathname === "/optimizer") {
    return "optimizer";
  }
  return "modules";
}

function pathForStep(step: AppStep): string {
  if (step === "results") {
    return "/estimate/results";
  }
  if (step === "inputs") {
    return "/estimate/inputs";
  }
  if (step === "analyzer") {
    return "/estimate";
  }
  if (step === "optimizer") {
    return "/optimizer";
  }
  return "/";
}

function readStoredAppState(): {
  selectedCountry?: DestinationCountry;
  filingStatus?: FilingStatus;
  usState?: UsStateCode;
  franceTaxResidencyStatus?: FranceTaxResidencyStatus;
  franceHouseholdParts?: number;
  usdPerEur?: number;
  franceVisaStatus?: FranceVisaStatus;
  willWorkInFrance?: boolean;
  franceHealthAffiliation?: FranceHealthAffiliation;
  lines?: IncomeLine[];
  result?: CalculationSnapshot | null;
} {
  try {
    return JSON.parse(window.sessionStorage.getItem(appStateStorageKey) ?? "{}");
  } catch {
    return {};
  }
}

function normalizeFranceTaxResidencyStatus(value: unknown): FranceTaxResidencyStatus {
  return value === "not_resident" ? "not_resident" : "resident";
}

function App() {
  const storedAppState = React.useMemo(() => readStoredAppState(), []);
  const [step, setStep] = React.useState<AppStep>(() => {
    const pathStep = stepFromPath(window.location.pathname);
    return pathStep === "results" && !storedAppState.result ? "inputs" : pathStep;
  });
  const [selectedCountry, setSelectedCountry] = React.useState<DestinationCountry>(storedAppState.selectedCountry ?? "france");
  const [filingStatus, setFilingStatus] = React.useState<FilingStatus>(storedAppState.filingStatus ?? "married_filing_jointly");
  const [usState, setUsState] = React.useState<UsStateCode>(storedAppState.usState ?? "TX");
  const [franceTaxResidencyStatus, setFranceTaxResidencyStatus] = React.useState<FranceTaxResidencyStatus>(
    normalizeFranceTaxResidencyStatus(storedAppState.franceTaxResidencyStatus)
  );
  const [franceHouseholdParts, setFranceHouseholdParts] = React.useState(storedAppState.franceHouseholdParts ?? 2);
  const [usdPerEur, setUsdPerEur] = React.useState(storedAppState.usdPerEur ?? 1.15);
  const [franceVisaStatus, setFranceVisaStatus] = React.useState<FranceVisaStatus>(storedAppState.franceVisaStatus ?? "visitor_retiree");
  const [willWorkInFrance, setWillWorkInFrance] = React.useState(storedAppState.willWorkInFrance ?? false);
  const [franceHealthAffiliation, setFranceHealthAffiliation] =
    React.useState<FranceHealthAffiliation>(storedAppState.franceHealthAffiliation ?? "unknown");
  const [lines, setLines] = React.useState<IncomeLine[]>(storedAppState.lines ?? initialLines);
  const [result, setResult] = React.useState<CalculationSnapshot | null>(storedAppState.result ?? null);
  const [isCalculating, setIsCalculating] = React.useState(false);
  const [calculationError, setCalculationError] = React.useState<string | null>(null);

  const annualIncome = lines.reduce((sum, line) => sum + line.monthlyAmountUsd * 12, 0);
  const advisorFlagCount = result?.country_tax.advisor_flags?.length ?? 0;
  const isTaxResident = franceTaxResidencyStatus === "resident";

  React.useEffect(() => {
    window.history.replaceState({ appStep: step }, "", pathForStep(step));

    function handlePopState(event: PopStateEvent) {
      const nextStep = event.state?.appStep;
      setStep(isAppStep(nextStep) ? nextStep : stepFromPath(window.location.pathname));
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [step]);

  React.useEffect(() => {
    window.sessionStorage.setItem(
      appStateStorageKey,
      JSON.stringify({
        selectedCountry,
        filingStatus,
        usState,
        franceTaxResidencyStatus,
        franceHouseholdParts,
        usdPerEur,
        franceVisaStatus,
        willWorkInFrance,
        franceHealthAffiliation,
        lines,
        result
      })
    );
  }, [
    selectedCountry,
    filingStatus,
    usState,
    franceTaxResidencyStatus,
    franceHouseholdParts,
    usdPerEur,
    franceVisaStatus,
    willWorkInFrance,
    franceHealthAffiliation,
    lines,
    result
  ]);

  function navigateToStep(nextStep: AppStep) {
    setStep(nextStep);
    window.history.pushState({ appStep: nextStep }, "", pathForStep(nextStep));
  }

  async function submitEstimate() {
    setIsCalculating(true);
    setCalculationError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/calculate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          filing_status: filingStatus,
          us_state: usState,
          destination_country: selectedCountry,
          destination_tax_resident: isTaxResident,
          france_household_parts: franceHouseholdParts,
          usd_per_eur: usdPerEur,
          france_visa_status: franceVisaStatus,
          will_work_in_france: willWorkInFrance,
          france_health_affiliation: franceHealthAffiliation,
          deduction_mode: "standard",
          income_lines: lines.map((line) => ({
            id: line.id,
            income_type: line.incomeType,
            monthly_amount_usd: line.monthlyAmountUsd,
            source_country: line.sourceCountry,
            ftc_basket: line.ftcBasket
          })),
          deduction_lines: []
        })
      });

      if (!response.ok) {
        throw new Error("Calculation failed. Please check the inputs and try again.");
      }

      setResult(await response.json());
      navigateToStep("results");
    } catch (error) {
      setCalculationError(error instanceof Error ? error.message : "Calculation failed");
    } finally {
      setIsCalculating(false);
    }
  }

  function addIncomeLine() {
    setLines((current) => [
      ...current,
      {
        id: `income-${current.length + 1}`,
        incomeType: "Traditional IRA",
        monthlyAmountUsd: 0,
        sourceCountry: "United States",
        ftcBasket: defaultFtcBasketByIncomeType["Traditional IRA"]
      }
    ]);
  }

  function updateLine(id: string, patch: Partial<IncomeLine>) {
    setLines((current) => current.map((line) => (line.id === id ? { ...line, ...patch } : line)));
  }

  function deleteLine(id: string) {
    setLines((current) => (current.length > 1 ? current.filter((line) => line.id !== id) : current));
  }

  return (
    <main className="app-shell">
      <section className="workspace" aria-labelledby="app-title">
        {step === "modules" ? (
          <ModuleLandingPage
            onSelectAnalyzer={() => navigateToStep("analyzer")}
            onSelectOptimizer={() => navigateToStep("optimizer")}
          />
        ) : null}

        {step === "analyzer" ? (
          <AnalyzerLandingPage
            selectedCountry={selectedCountry}
            onSelectCountry={setSelectedCountry}
            onContinue={() => navigateToStep("inputs")}
            onBack={() => navigateToStep("modules")}
          />
        ) : null}

        {step === "optimizer" ? <OptimizerLandingPage onBack={() => navigateToStep("modules")} /> : null}

        {step === "inputs" ? (
          <InputsPage
            filingStatus={filingStatus}
            usState={usState}
            franceTaxResidencyStatus={franceTaxResidencyStatus}
            franceHouseholdParts={franceHouseholdParts}
            usdPerEur={usdPerEur}
            franceVisaStatus={franceVisaStatus}
            willWorkInFrance={willWorkInFrance}
            franceHealthAffiliation={franceHealthAffiliation}
            lines={lines}
            annualIncome={annualIncome}
            calculationError={calculationError}
            isCalculating={isCalculating}
            onBack={() => navigateToStep("analyzer")}
            onFilingStatusChange={setFilingStatus}
            onUsStateChange={setUsState}
            onFranceTaxResidencyStatusChange={setFranceTaxResidencyStatus}
            onFranceHouseholdPartsChange={setFranceHouseholdParts}
            onUsdPerEurChange={setUsdPerEur}
            onFranceVisaStatusChange={setFranceVisaStatus}
            onWillWorkInFranceChange={setWillWorkInFrance}
            onFranceHealthAffiliationChange={setFranceHealthAffiliation}
            onAddIncomeLine={addIncomeLine}
            onUpdateLine={updateLine}
            onDeleteLine={deleteLine}
            onSubmit={submitEstimate}
          />
        ) : null}

        {step === "results" && result ? (
          <ResultsPage
            result={result}
            advisorFlagCount={advisorFlagCount}
            onBack={() => navigateToStep("inputs")}
            onStartOver={() => navigateToStep("analyzer")}
          />
        ) : null}
      </section>
    </main>
  );
}

function ModuleLandingPage({
  onSelectAnalyzer,
  onSelectOptimizer
}: {
  onSelectAnalyzer: () => void;
  onSelectOptimizer: () => void;
}) {
  return (
    <div className="module-landing" aria-labelledby="app-title">
      <h1 className="module-title" id="app-title">
        Know Thy Taxes...when you move abroad
      </h1>
      <button className="module-tile" type="button" onClick={onSelectAnalyzer}>
        <Calculator size={20} aria-hidden="true" />
        <span>Tax Estimator</span>
      </button>
      <button className="module-tile" type="button" onClick={onSelectOptimizer}>
        <ShieldCheck size={20} aria-hidden="true" />
        <span>Tax Optimizer</span>
      </button>
    </div>
  );
}

function AnalyzerLandingPage({
  selectedCountry,
  onSelectCountry,
  onContinue,
  onBack
}: {
  selectedCountry: DestinationCountry;
  onSelectCountry: (country: DestinationCountry) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">Tax Estimator</p>
          <h1 id="app-title">Estimate your taxes by country</h1>
        </div>
        <button className="ghost-button" type="button" onClick={onBack}>
          <ArrowLeft size={16} aria-hidden="true" />
          Modules
        </button>
      </header>

      <div className="landing-layout">
        <section className="landing-copy" aria-labelledby="app-title">
          <p className="lede">
            Tax Treaty Estimator is for US citizens exploring retirement or long-term relocation abroad. It estimates
            destination-country tax exposure, separates local social charges, and highlights treaty areas that deserve
            advisor review.
          </p>
          <div className="output-list" aria-label="Estimator outputs">
            <div>
              <Check size={16} aria-hidden="true" />
              Destination income tax and taxable-income estimate
            </div>
            <div>
              <Check size={16} aria-hidden="true" />
              Local social charges shown separately from income tax
            </div>
            <div>
              <Check size={16} aria-hidden="true" />
              Advisor-review flags for treaty-sensitive income
            </div>
          </div>
        </section>

        <section className="country-selector" aria-labelledby="country-heading">
          <div>
            <p className="eyebrow">Choose a country</p>
            <h2 id="country-heading">Start with one destination</h2>
          </div>
          <div className="country-grid">
            <button
              className={`country-card ${selectedCountry === "france" ? "selected" : ""}`}
              type="button"
              onClick={() => onSelectCountry("france")}
            >
              <strong>France</strong>
              <span>Live estimate</span>
            </button>
            <button className="country-card" type="button" disabled>
              <strong>Italy</strong>
              <span>Coming later</span>
            </button>
            <button className="country-card" type="button" disabled>
              <strong>Portugal</strong>
              <span>Coming later</span>
            </button>
          </div>
          <button className="primary-button full-width" type="button" onClick={onContinue}>
            Continue with France
          </button>
        </section>
      </div>
    </>
  );
}

function OptimizerLandingPage({ onBack }: { onBack: () => void }) {
  const [selectedPair, setSelectedPair] = React.useState("");

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">Tax Optimizer</p>
          <h1 id="app-title">Optimize your cross-border tax picture</h1>
        </div>
        <button className="ghost-button" type="button" onClick={onBack}>
          <ArrowLeft size={16} aria-hidden="true" />
          Modules
        </button>
      </header>

      <section className="optimizer-panel" aria-labelledby="app-title">
        <p>
          Tax Optimizer will suggest common and advisor-review strategies for reducing combined US and destination-country tax
          exposure. It will focus on timing, income mix, treaty positions, foreign tax credits, social-charge exposure,
          retirement distributions, investment income, and household-structure assumptions.
        </p>
        <div className="optimizer-note" role="status">
          This module is not live yet. Recommendations will be separated into routine planning ideas and higher-risk
          items that require qualified French/US advisor review.
        </div>
        <label className="optimizer-selector">
          Treaty pair
          <select value={selectedPair} onChange={(event) => setSelectedPair(event.target.value)}>
            <option value="">Select a treaty pair</option>
            <option value="US-France">US-France</option>
            <option value="US-Spain">US-Spain</option>
            <option value="US-Portugal">US-Portugal</option>
          </select>
        </label>
        {selectedPair ? (
          <div className="optimizer-selection" role="status">
            <strong>{selectedPair}</strong>
            <span>Next step: define the optimization scope and country-specific strategy categories.</span>
          </div>
        ) : null}
      </section>
    </>
  );
}

function InputsPage({
  filingStatus,
  usState,
  franceTaxResidencyStatus,
  franceHouseholdParts,
  usdPerEur,
  franceVisaStatus,
  willWorkInFrance,
  franceHealthAffiliation,
  lines,
  annualIncome,
  calculationError,
  isCalculating,
  onBack,
  onFilingStatusChange,
  onUsStateChange,
  onFranceTaxResidencyStatusChange,
  onFranceHouseholdPartsChange,
  onUsdPerEurChange,
  onFranceVisaStatusChange,
  onWillWorkInFranceChange,
  onFranceHealthAffiliationChange,
  onAddIncomeLine,
  onUpdateLine,
  onDeleteLine,
  onSubmit
}: {
  filingStatus: FilingStatus;
  usState: UsStateCode;
  franceTaxResidencyStatus: FranceTaxResidencyStatus;
  franceHouseholdParts: number;
  usdPerEur: number;
  franceVisaStatus: FranceVisaStatus;
  willWorkInFrance: boolean;
  franceHealthAffiliation: FranceHealthAffiliation;
  lines: IncomeLine[];
  annualIncome: number;
  calculationError: string | null;
  isCalculating: boolean;
  onBack: () => void;
  onFilingStatusChange: (status: FilingStatus) => void;
  onUsStateChange: (state: UsStateCode) => void;
  onFranceTaxResidencyStatusChange: (status: FranceTaxResidencyStatus) => void;
  onFranceHouseholdPartsChange: (value: number) => void;
  onUsdPerEurChange: (value: number) => void;
  onFranceVisaStatusChange: (status: FranceVisaStatus) => void;
  onWillWorkInFranceChange: (value: boolean) => void;
  onFranceHealthAffiliationChange: (status: FranceHealthAffiliation) => void;
  onAddIncomeLine: () => void;
  onUpdateLine: (id: string, patch: Partial<IncomeLine>) => void;
  onDeleteLine: (id: string) => void;
  onSubmit: () => void;
}) {
  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">France estimate</p>
          <h1 id="app-title">Enter income assumptions</h1>
        </div>
        <button className="ghost-button" type="button" onClick={onBack}>
          <ArrowLeft size={16} aria-hidden="true" />
          Countries
        </button>
      </header>

      <div className="grid">
        <section className="panel" aria-labelledby="profile-heading">
          <h2 id="profile-heading">Scenario Profile</h2>
          <div className="field-grid">
            <label>
              Filing status
              <select value={filingStatus} onChange={(event) => onFilingStatusChange(event.target.value as FilingStatus)}>
                <option value="single">Single</option>
                <option value="married_filing_jointly">Married filing jointly</option>
                <option value="married_filing_separately">Married filing separately</option>
                <option value="head_of_household">Head of household</option>
              </select>
            </label>
            <label>
              US state
              <select value={usState} onChange={(event) => onUsStateChange(event.target.value as UsStateCode)}>
                {usStates.map((state) => (
                  <option key={state.code} value={state.code}>
                    {state.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              French tax residency*
              <select
                value={franceTaxResidencyStatus}
                onChange={(event) => onFranceTaxResidencyStatusChange(event.target.value as FranceTaxResidencyStatus)}
              >
                <option value="resident">French tax resident</option>
                <option value="not_resident">Not French tax resident</option>
              </select>
            </label>
            <label>
              French household parts**
              <input
                aria-label="French tax household parts"
                type="number"
                min="1"
                max="20"
                step="0.5"
                inputMode="decimal"
                value={franceHouseholdParts}
                onChange={(event) => onFranceHouseholdPartsChange(Math.max(1, Number(event.target.value) || 1))}
              />
            </label>
            <label>
              USD per EUR
              <input
                aria-label="US dollars per euro"
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                value={usdPerEur}
                onChange={(event) => onUsdPerEurChange(Math.max(0.01, Number(event.target.value) || 1.15))}
              />
            </label>
          </div>
          <div className="subsection">
            <h3>Residency and immigration facts</h3>
            <div className="field-grid">
              <label>
                France visa / stay status
                <select
                  value={franceVisaStatus}
                  onChange={(event) => onFranceVisaStatusChange(event.target.value as FranceVisaStatus)}
                >
                  <option value="visitor_retiree">Visitor / retiree</option>
                  <option value="employee">Employee status</option>
                  <option value="self_employed">Self-employed status</option>
                  <option value="talent_professional">Talent / professional</option>
                  <option value="student">Student</option>
                  <option value="other_unsure">Other / unsure</option>
                </select>
              </label>
              <label>
                Work performed while in France
                <select
                  value={willWorkInFrance ? "yes" : "no"}
                  onChange={(event) => onWillWorkInFranceChange(event.target.value === "yes")}
                >
                  <option value="no">No French work assumed</option>
                  <option value="yes">Yes, work in France</option>
                </select>
              </label>
              <label>
                French health / social affiliation
                <select
                  value={franceHealthAffiliation}
                  onChange={(event) => onFranceHealthAffiliationChange(event.target.value as FranceHealthAffiliation)}
                >
                  <option value="unknown">Unknown / review needed</option>
                  <option value="french_system">Affiliated with French system</option>
                  <option value="us_totalization_or_private">US totalization or private coverage</option>
                  <option value="not_affiliated">Not affiliated</option>
                </select>
              </label>
            </div>
          </div>
        </section>

        <section className="panel income-panel" aria-labelledby="income-heading">
          <div className="section-heading">
            <h2 id="income-heading">Income Lines</h2>
            <button className="icon-button" type="button" onClick={onAddIncomeLine} aria-label="Add income line">
              <Plus size={18} aria-hidden="true" />
            </button>
          </div>
          <div className="income-table" role="table" aria-label="Income lines">
            <div className="table-row table-head" role="row">
              <span role="columnheader">Type</span>
              <span role="columnheader">Monthly USD</span>
              <span role="columnheader">Source</span>
              <span role="columnheader">FTC basket</span>
              <span role="columnheader" aria-label="Delete income row" />
            </div>
            {lines.map((line) => (
              <div className="table-row" role="row" key={line.id}>
                <select
                  aria-label="Income type"
                  value={line.incomeType}
                  onChange={(event) => {
                    const incomeType = event.target.value;
                    onUpdateLine(line.id, {
                      incomeType,
                      ftcBasket: defaultFtcBasketByIncomeType[incomeType] ?? "unknown"
                    });
                  }}
                >
                  {incomeTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <input
                  aria-label="Monthly amount in USD"
                  type="number"
                  min="0"
                  inputMode="decimal"
                  value={line.monthlyAmountUsd}
                  onChange={(event) => onUpdateLine(line.id, { monthlyAmountUsd: Number(event.target.value) })}
                />
                <input
                  aria-label="Source country"
                  value={line.sourceCountry}
                  onChange={(event) => onUpdateLine(line.id, { sourceCountry: event.target.value })}
                />
                <select
                  aria-label="Foreign tax credit basket"
                  value={line.ftcBasket}
                  onChange={(event) => onUpdateLine(line.id, { ftcBasket: event.target.value as FtcBasket })}
                >
                  <option value="general">General</option>
                  <option value="passive">Passive</option>
                  <option value="treaty_resourced">Treaty-resourced</option>
                  <option value="not_applicable">Not applicable</option>
                  <option value="unknown">Unknown</option>
                </select>
                <button
                  className="row-delete-button"
                  type="button"
                  onClick={() => onDeleteLine(line.id)}
                  disabled={lines.length <= 1}
                  aria-label={`Remove ${line.incomeType} income line`}
                >
                  x
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="submit-bar" aria-label="Submit estimate">
        <div>
          <span>Annual income modeled</span>
          <strong>{formatUsd(annualIncome)}</strong>
        </div>
        {calculationError ? <p className="error-text">{calculationError}</p> : null}
        <button className="primary-button" type="button" onClick={onSubmit} disabled={isCalculating}>
          <Calculator size={16} aria-hidden="true" />
          {isCalculating ? "Calculating" : "Calculate tax estimates"}
        </button>
      </section>
      <aside className="input-notes" aria-label="Input notes">
        <p>
          Notes: * See{" "}
          <a href="https://www.impots.gouv.fr/resident-de-france" target="_blank" rel="noreferrer">
            impots.gouv.fr guidance on French tax residence criteria
          </a>
          ; consult a tax professional if unsure.
        </p>
        <p>
          ** See{" "}
          <a href="https://www.service-public.fr/particuliers/vosdroits/F2705" target="_blank" rel="noreferrer">
            Service-Public guidance on calculating French household parts
          </a>
          .
        </p>
        <p>
          Scope caveat: this tool does not estimate wealth tax, inheritance or gift tax, VAT, corporate tax, or
          corporate/self-employment social taxes.
        </p>
      </aside>
    </>
  );
}

function ResultsPage({
  result,
  advisorFlagCount,
  onBack,
  onStartOver
}: {
  result: CalculationSnapshot;
  advisorFlagCount: number;
  onBack: () => void;
  onStartOver: () => void;
}) {
  const incomeRows = getIncomeRows(result.country_tax);
  const rowTotals = incomeRows.reduce(
    (totals, row) => ({
      annualIncome: totals.annualIncome + row.annual_amount_usd,
      taxableIncome: totals.taxableIncome + row.france_taxable_amount_usd,
      incomeTax: totals.incomeTax + row.france_income_tax_usd,
      socialCharges: totals.socialCharges + row.france_social_charges_usd
    }),
    { annualIncome: 0, taxableIncome: 0, incomeTax: 0, socialCharges: 0 }
  );
  const sortedAdvisorFlags = [...(result.country_tax.advisor_flags ?? [])].sort(
    (a, b) => advisorSeverityRank(b.severity) - advisorSeverityRank(a.severity)
  );

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">France estimate</p>
          <h1 id="app-title">Tax estimate output</h1>
          <p className="output-scope-note">
            Note: US federal tax, US state income tax and Form 1116 foreign tax credits are still under development.
          </p>
        </div>
        <div className="toolbar-actions">
          <button className="ghost-button" type="button" onClick={onBack}>
            <ArrowLeft size={16} aria-hidden="true" />
            Edit inputs
          </button>
          <button className="ghost-button" type="button" onClick={onStartOver}>
            Countries
          </button>
        </div>
      </header>

      <section className="results" aria-labelledby="results-heading">
        <div>
          <p className="eyebrow">Estimate summary</p>
          <h2 id="results-heading">France tax estimate</h2>
        </div>
        <div className="income-results-table" role="table" aria-label="France tax estimate by income type">
          <div className="income-result-row summary-head" role="row">
            <span role="columnheader">Income type</span>
            <span role="columnheader">Annual Income</span>
            <span role="columnheader">France Taxable Income</span>
            <span role="columnheader">France Income Tax</span>
            <span role="columnheader">France Social charges</span>
            <span role="columnheader">Notes</span>
          </div>
          {incomeRows.map((row) => (
            <div className="income-result-row" role="row" key={row.income_line_id}>
              <span>{row.income_type}</span>
              <strong>{formatUsd(row.annual_amount_usd)}</strong>
              <strong>{formatUsd(row.france_taxable_amount_usd)}</strong>
              <strong>{formatUsd(row.france_income_tax_usd)}</strong>
              <strong>{formatUsd(row.france_social_charges_usd)}</strong>
              <span>{row.notes.length > 0 ? row.notes.join(" ") : "No special note."}</span>
            </div>
          ))}
          <div className="income-result-row total-row" role="row">
            <span>Total</span>
            <strong>{formatUsd(rowTotals.annualIncome)}</strong>
            <strong>{formatUsd(rowTotals.taxableIncome)}</strong>
            <strong>{formatUsd(rowTotals.incomeTax)}</strong>
            <strong>{formatUsd(rowTotals.socialCharges)}</strong>
            <span>
              US federal tax after FTC is pending because the US federal tax and Form 1116 FTC module has not been
              built yet. See{" "}
              <a
                href="https://www.impots.gouv.fr/particulier/questions/comment-calculer-mon-taux-dimposition-dapres-le-bareme-progressif-de-limpot"
                target="_blank"
                rel="noreferrer"
              >
                French tax brackets
              </a>
              .
            </span>
          </div>
        </div>
        <details className="detail-panel collapsible-panel">
          <summary id="social-charges-heading">Would you like to see the breakdown of the French social charges?</summary>
          <div className="social-charge-table" role="table" aria-label="French social charges by income type">
            <div className="social-charge-row social-charge-head" role="row">
              <span role="columnheader">Income type</span>
              <span role="columnheader">Income value</span>
              {socialChargeColumns.map((column) => (
                <span role="columnheader" key={column.key}>
                  {column.label}
                </span>
              ))}
              <span role="columnheader">Total social charges</span>
            </div>
            {incomeRows.map((row) => (
              <div className="social-charge-row" role="row" key={`${row.income_line_id}-social-charges`}>
                <span>{row.income_type}</span>
                <strong>{formatUsd(row.annual_amount_usd)}</strong>
                {socialChargeColumns.map((column) => (
                  <strong key={column.key}>{formatSocialChargeCell(row, column.rate)}</strong>
                ))}
                <strong>{formatUsd(row.france_social_charges_usd)}</strong>
              </div>
            ))}
            <div className="social-charge-row total-row" role="row">
              <span>Total</span>
              <strong>{formatUsd(rowTotals.annualIncome)}</strong>
              {socialChargeColumns.map((column) => {
                const total = incomeRows.reduce((sum, row) => {
                  const amount = socialChargeComponentAmount(row, column.rate);
                  return sum + (amount ?? 0);
                }, 0);
                return <strong key={column.key}>{column.rate > 0 ? formatUsd(total) : "N/A"}</strong>;
              })}
              <strong>{formatUsd(rowTotals.socialCharges)}</strong>
            </div>
          </div>
        </details>

        <div className="detail-grid">
          <details className="detail-panel collapsible-panel">
            <summary id="advisor-flags-heading">Tax professional review recommended</summary>
            <div className="flag-list">
              {sortedAdvisorFlags.map((flag, index) => (
                <div className="flag-item" key={`${flag.code}-${flag.income_line_id ?? "scenario"}`}>
                  <span className="flag-number">{index + 1}</span>
                  <div>
                    <strong>{getReviewSubject(flag, incomeRows)}</strong>
                    <span className="flag-severity">{flag.severity.toUpperCase()}</span>
                    <span>{flag.message}</span>
                  </div>
                </div>
              ))}
            </div>
          </details>
        </div>

        <details className="detail-panel collapsible-panel">
          <summary id="sources-heading">Sources</summary>
          <div className="source-list">
            {(result.country_tax.sources ?? []).map((source) => (
              <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
                {source.label}
              </a>
            ))}
          </div>
        </details>
        <aside className="fine-print" aria-label="Advisor review notice">
          <ShieldCheck size={12} aria-hidden="true" />
          <p>
            Exploratory estimate only. Advisor review is required for treaty-resourced income, Roth treatment,
            pensions, Social Security, social charges, and any basket classified as unknown.
          </p>
        </aside>
      </section>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
