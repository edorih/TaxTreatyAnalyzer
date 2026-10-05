import React from "react";
import ReactDOM from "react-dom/client";
import { Calculator, Plus, ShieldCheck } from "lucide-react";
import "./styles.css";

type DestinationCountry = "france" | "italy" | "portugal";
type FtcBasket = "passive" | "general" | "treaty_resourced" | "unknown";
type FilingStatus = "single" | "married_filing_jointly" | "married_filing_separately" | "head_of_household";

type IncomeLine = {
  id: string;
  incomeType: string;
  monthlyAmountUsd: number;
  sourceCountry: string;
  ftcBasket: FtcBasket;
};

type CountryTaxResult = {
  country?: string;
  status?: string;
  estimated_income_tax_usd?: number;
  estimated_social_charges_usd?: number;
  total_taxable_income_usd?: number;
  advisor_flags?: Array<{ code: string; severity: string; message: string }>;
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

function countryLabel(country: DestinationCountry): string {
  return country[0].toUpperCase() + country.slice(1);
}

function App() {
  const [countryA, setCountryA] = React.useState<DestinationCountry>("france");
  const [countryB, setCountryB] = React.useState<DestinationCountry>("portugal");
  const [filingStatus, setFilingStatus] = React.useState<FilingStatus>("married_filing_jointly");
  const [isTaxResident, setIsTaxResident] = React.useState(true);
  const [lines, setLines] = React.useState<IncomeLine[]>(initialLines);
  const [resultA, setResultA] = React.useState<CalculationSnapshot | null>(null);
  const [resultB, setResultB] = React.useState<CalculationSnapshot | null>(null);
  const [isCalculating, setIsCalculating] = React.useState(false);
  const [calculationError, setCalculationError] = React.useState<string | null>(null);

  const annualIncome = lines.reduce((sum, line) => sum + line.monthlyAmountUsd * 12, 0);
  const basketTotals = lines.reduce<Record<string, number>>((acc, line) => {
    acc[line.ftcBasket] = (acc[line.ftcBasket] ?? 0) + line.monthlyAmountUsd * 12;
    return acc;
  }, {});

  async function calculateForCountry(country: DestinationCountry): Promise<CalculationSnapshot> {
    const response = await fetch(`${apiBaseUrl}/calculate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        filing_status: filingStatus,
        destination_country: country,
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
      throw new Error(`Calculation failed for ${countryLabel(country)}`);
    }
    return response.json();
  }

  async function calculateComparison() {
    setIsCalculating(true);
    setCalculationError(null);
    try {
      const [nextResultA, nextResultB] = await Promise.all([calculateForCountry(countryA), calculateForCountry(countryB)]);
      setResultA(nextResultA);
      setResultB(nextResultB);
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

  function countryCell(result: CalculationSnapshot | null, key: keyof CountryTaxResult): string {
    if (!result) {
      return "Run estimate";
    }
    if (result.country_tax.status === "country_module_not_implemented") {
      return "Not implemented";
    }
    const value = result.country_tax[key];
    return typeof value === "number" ? formatUsd(value) : "Pending";
  }

  const flagsA = resultA?.country_tax.advisor_flags?.length ?? 0;
  const flagsB = resultB?.country_tax.advisor_flags?.length ?? 0;

  return (
    <main className="app-shell">
      <section className="workspace" aria-labelledby="scenario-title">
        <header className="topbar">
          <div>
            <p className="eyebrow">2026 exploratory estimate</p>
            <h1 id="scenario-title">Tax Treaty Analyzer</h1>
          </div>
          <button className="primary-button" type="button" onClick={calculateComparison} disabled={isCalculating}>
            <Calculator size={16} aria-hidden="true" />
            {isCalculating ? "Calculating" : "Calculate estimate"}
          </button>
        </header>

        <div className="grid">
          <section className="panel" aria-labelledby="profile-heading">
            <h2 id="profile-heading">Scenario Profile</h2>
            <div className="field-grid">
              <label>
                Destination A
                <select value={countryA} onChange={(event) => setCountryA(event.target.value as DestinationCountry)}>
                  <option value="france">France</option>
                  <option value="italy">Italy</option>
                  <option value="portugal">Portugal</option>
                </select>
              </label>
              <label>
                Destination B
                <select value={countryB} onChange={(event) => setCountryB(event.target.value as DestinationCountry)}>
                  <option value="france">France</option>
                  <option value="italy">Italy</option>
                  <option value="portugal">Portugal</option>
                </select>
              </label>
              <label>
                Filing status
                <select value={filingStatus} onChange={(event) => setFilingStatus(event.target.value as FilingStatus)}>
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
                Tax residency assumption
                <select value={isTaxResident ? "yes" : "unsure"} onChange={(event) => setIsTaxResident(event.target.value === "yes")}>
                  <option value="yes">Tax resident in both compared countries</option>
                  <option value="unsure">Need advisor review</option>
                </select>
              </label>
            </div>
          </section>

          <section className="panel income-panel" aria-labelledby="income-heading">
            <div className="section-heading">
              <h2 id="income-heading">Income Lines</h2>
              <button className="icon-button" type="button" onClick={addIncomeLine} aria-label="Add income line">
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
                    onChange={(event) => updateLine(line.id, { incomeType: event.target.value })}
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
                    onChange={(event) => updateLine(line.id, { monthlyAmountUsd: Number(event.target.value) })}
                  />
                  <input
                    aria-label="Source country"
                    value={line.sourceCountry}
                    onChange={(event) => updateLine(line.id, { sourceCountry: event.target.value })}
                  />
                  <select
                    aria-label="Foreign tax credit basket"
                    value={line.ftcBasket}
                    onChange={(event) => updateLine(line.id, { ftcBasket: event.target.value as FtcBasket })}
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

        <section className="results" aria-labelledby="results-heading">
          <div>
            <p className="eyebrow">Estimate summary</p>
            <h2 id="results-heading">Destination comparison</h2>
          </div>
          {calculationError ? <p className="error-text">{calculationError}</p> : null}
          <div className="summary-table" role="table" aria-label="Tax estimate summary">
            <div className="summary-row summary-head" role="row">
              <span role="columnheader">Measure</span>
              <span role="columnheader">{countryLabel(countryA)}</span>
              <span role="columnheader">{countryLabel(countryB)}</span>
              <span role="columnheader">FTC notes</span>
            </div>
            <div className="summary-row" role="row">
              <span>Annual income modeled</span>
              <strong>{formatUsd(resultA?.annual_income_usd ?? annualIncome)}</strong>
              <strong>{formatUsd(resultB?.annual_income_usd ?? annualIncome)}</strong>
              <span>Basket-aware inputs captured</span>
            </div>
            <div className="summary-row" role="row">
              <span>US federal income tax</span>
              <strong>Pending US rules</strong>
              <strong>Pending US rules</strong>
              <span>Before foreign tax credit</span>
            </div>
            <div className="summary-row" role="row">
              <span>State income tax</span>
              <strong>{formatUsd(0)}</strong>
              <strong>{formatUsd(0)}</strong>
              <span>Texas only in MVP</span>
            </div>
            <div className="summary-row" role="row">
              <span>Destination taxable income</span>
              <strong>{countryCell(resultA, "total_taxable_income_usd")}</strong>
              <strong>{countryCell(resultB, "total_taxable_income_usd")}</strong>
              <span>Country-specific module result</span>
            </div>
            <div className="summary-row" role="row">
              <span>Destination income tax</span>
              <strong>{countryCell(resultA, "estimated_income_tax_usd")}</strong>
              <strong>{countryCell(resultB, "estimated_income_tax_usd")}</strong>
              <span>France module active; Italy/Portugal pending</span>
            </div>
            <div className="summary-row" role="row">
              <span>Destination social charges</span>
              <strong>{countryCell(resultA, "estimated_social_charges_usd")}</strong>
              <strong>{countryCell(resultB, "estimated_social_charges_usd")}</strong>
              <span>Tracked separately from income tax</span>
            </div>
            <div className="summary-row" role="row">
              <span>Advisor-review flags</span>
              <strong>{resultA ? flagsA : "Run estimate"}</strong>
              <strong>{resultB ? flagsB : "Run estimate"}</strong>
              <span>Conservative flags are expected in v1</span>
            </div>
            <div className="summary-row" role="row">
              <span>Estimated worldwide tax</span>
              <strong>Pending</strong>
              <strong>Pending</strong>
              <span>US federal + state + destination - allowable FTC</span>
            </div>
          </div>
          <div className="basket-strip" aria-label="FTC basket totals">
            {Object.entries(basketTotals).map(([basket, total]) => (
              <div key={basket}>
                <span>{basket.replace("_", " ")}</span>
                <strong>{formatUsd(total)}</strong>
              </div>
            ))}
          </div>
          <aside className="fine-print" aria-label="Advisor review notice">
            <ShieldCheck size={12} aria-hidden="true" />
            <p>
              Exploratory estimate only. Advisor review is required for treaty-resourced income, Roth treatment,
              pensions, Social Security, and any basket classified as unknown.
            </p>
          </aside>
        </section>
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

