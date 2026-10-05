import React from "react";
import ReactDOM from "react-dom/client";
import { ArrowLeft, Calculator, Check, Plus, ShieldCheck } from "lucide-react";
import "./styles.css";

type DestinationCountry = "france" | "italy" | "portugal";
type FtcBasket = "passive" | "general" | "treaty_resourced" | "unknown";
type FilingStatus = "single" | "married_filing_jointly" | "married_filing_separately" | "head_of_household";
type AppStep = "landing" | "inputs" | "results";

type IncomeLine = {
  id: string;
  incomeType: string;
  monthlyAmountUsd: number;
  sourceCountry: string;
  ftcBasket: FtcBasket;
};

type CountryTaxResult = {
  estimated_income_tax_usd?: number;
  estimated_social_charges_usd?: number;
  total_taxable_income_usd?: number;
  advisor_flags?: Array<{ code: string; severity: string; message: string }>;
  assumptions?: string[];
};

type CalculationSnapshot = {
  annual_income_usd: number;
  country_tax: CountryTaxResult;
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";

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
  "529 withdrawal"
];

const initialLines: IncomeLine[] = [
  {
    id: "income-1",
    incomeType: "401(k)",
    monthlyAmountUsd: 4000,
    sourceCountry: "United States",
    ftcBasket: "general"
  },
  {
    id: "income-2",
    incomeType: "Brokerage dividends",
    monthlyAmountUsd: 1200,
    sourceCountry: "United States",
    ftcBasket: "passive"
  }
];

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

function App() {
  const [step, setStep] = React.useState<AppStep>("landing");
  const [selectedCountry, setSelectedCountry] = React.useState<DestinationCountry>("france");
  const [filingStatus, setFilingStatus] = React.useState<FilingStatus>("married_filing_jointly");
  const [isTaxResident, setIsTaxResident] = React.useState(true);
  const [lines, setLines] = React.useState<IncomeLine[]>(initialLines);
  const [result, setResult] = React.useState<CalculationSnapshot | null>(null);
  const [isCalculating, setIsCalculating] = React.useState(false);
  const [calculationError, setCalculationError] = React.useState<string | null>(null);

  const annualIncome = lines.reduce((sum, line) => sum + line.monthlyAmountUsd * 12, 0);
  const advisorFlagCount = result?.country_tax.advisor_flags?.length ?? 0;

  async function submitEstimate() {
    setIsCalculating(true);
    setCalculationError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/calculate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          filing_status: filingStatus,
          destination_country: selectedCountry,
          destination_tax_resident: isTaxResident,
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
      setStep("results");
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
        ftcBasket: "unknown"
      }
    ]);
  }

  function updateLine(id: string, patch: Partial<IncomeLine>) {
    setLines((current) => current.map((line) => (line.id === id ? { ...line, ...patch } : line)));
  }

  return (
    <main className="app-shell">
      <section className="workspace" aria-labelledby="app-title">
        {step === "landing" ? (
          <LandingPage
            selectedCountry={selectedCountry}
            onSelectCountry={setSelectedCountry}
            onContinue={() => setStep("inputs")}
          />
        ) : null}

        {step === "inputs" ? (
          <InputsPage
            filingStatus={filingStatus}
            isTaxResident={isTaxResident}
            lines={lines}
            annualIncome={annualIncome}
            calculationError={calculationError}
            isCalculating={isCalculating}
            onBack={() => setStep("landing")}
            onFilingStatusChange={setFilingStatus}
            onTaxResidentChange={setIsTaxResident}
            onAddIncomeLine={addIncomeLine}
            onUpdateLine={updateLine}
            onSubmit={submitEstimate}
          />
        ) : null}

        {step === "results" && result ? (
          <ResultsPage
            result={result}
            advisorFlagCount={advisorFlagCount}
            onBack={() => setStep("inputs")}
            onStartOver={() => setStep("landing")}
          />
        ) : null}
      </section>
    </main>
  );
}

function LandingPage({
  selectedCountry,
  onSelectCountry,
  onContinue
}: {
  selectedCountry: DestinationCountry;
  onSelectCountry: (country: DestinationCountry) => void;
  onContinue: () => void;
}) {
  return (
    <div className="landing-layout">
      <section className="landing-copy" aria-labelledby="app-title">
        <p className="eyebrow">US citizen retirement tax estimator</p>
        <h1 id="app-title">Compare how a move abroad may affect your tax picture.</h1>
        <p className="lede">
          Tax Treaty Analyzer is for US citizens exploring retirement or long-term relocation abroad. It estimates
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
  );
}

function InputsPage({
  filingStatus,
  isTaxResident,
  lines,
  annualIncome,
  calculationError,
  isCalculating,
  onBack,
  onFilingStatusChange,
  onTaxResidentChange,
  onAddIncomeLine,
  onUpdateLine,
  onSubmit
}: {
  filingStatus: FilingStatus;
  isTaxResident: boolean;
  lines: IncomeLine[];
  annualIncome: number;
  calculationError: string | null;
  isCalculating: boolean;
  onBack: () => void;
  onFilingStatusChange: (status: FilingStatus) => void;
  onTaxResidentChange: (value: boolean) => void;
  onAddIncomeLine: () => void;
  onUpdateLine: (id: string, patch: Partial<IncomeLine>) => void;
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
              <select value="texas" disabled>
                <option value="texas">Texas</option>
              </select>
            </label>
            <label>
              France tax residency
              <select value={isTaxResident ? "yes" : "review"} onChange={(event) => onTaxResidentChange(event.target.value === "yes")}>
                <option value="yes">Assume France tax resident</option>
                <option value="review">Need advisor review</option>
              </select>
            </label>
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
            </div>
            {lines.map((line) => (
              <div className="table-row" role="row" key={line.id}>
                <select
                  aria-label="Income type"
                  value={line.incomeType}
                  onChange={(event) => onUpdateLine(line.id, { incomeType: event.target.value })}
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
                  <option value="unknown">Unknown</option>
                </select>
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
          {isCalculating ? "Calculating" : "Submit estimate"}
        </button>
      </section>
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
  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">France estimate</p>
          <h1 id="app-title">Tax estimate output</h1>
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
        <div className="summary-table" role="table" aria-label="France tax estimate summary">
          <div className="result-row summary-head" role="row">
            <span role="columnheader">Measure</span>
            <span role="columnheader">Estimate</span>
            <span role="columnheader">Notes</span>
          </div>
          <div className="result-row" role="row">
            <span>Annual income modeled</span>
            <strong>{formatUsd(result.annual_income_usd)}</strong>
            <span>Monthly inputs annualized</span>
          </div>
          <div className="result-row" role="row">
            <span>France taxable income</span>
            <strong>{formatUsd(result.country_tax.total_taxable_income_usd)}</strong>
            <span>Based on the France v1 country module</span>
          </div>
          <div className="result-row" role="row">
            <span>France income tax</span>
            <strong>{formatUsd(result.country_tax.estimated_income_tax_usd)}</strong>
            <span>Progressive and flat investment treatment where mapped</span>
          </div>
          <div className="result-row" role="row">
            <span>France social charges</span>
            <strong>{formatUsd(result.country_tax.estimated_social_charges_usd)}</strong>
            <span>Shown separately from income tax</span>
          </div>
          <div className="result-row" role="row">
            <span>US federal tax after FTC</span>
            <strong>Pending</strong>
            <span>FTC module not yet connected to final worldwide result</span>
          </div>
          <div className="result-row" role="row">
            <span>Advisor-review flags</span>
            <strong>{advisorFlagCount}</strong>
            <span>Conservative flags are expected in v1</span>
          </div>
        </div>
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

