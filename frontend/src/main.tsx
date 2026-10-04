import React from "react";
import ReactDOM from "react-dom/client";
import { Plus, Save, ShieldCheck } from "lucide-react";
import "./styles.css";

type DestinationCountry = "france" | "italy" | "portugal";
type FtcBasket = "passive" | "general" | "treaty_resourced" | "unknown";

type IncomeLine = {
  id: string;
  incomeType: string;
  monthlyAmountUsd: number;
  sourceCountry: string;
  ftcBasket: FtcBasket;
};

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

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function App() {
  const [countryA, setCountryA] = React.useState<DestinationCountry>("france");
  const [countryB, setCountryB] = React.useState<DestinationCountry>("portugal");
  const [lines, setLines] = React.useState<IncomeLine[]>(initialLines);

  const annualIncome = lines.reduce((sum, line) => sum + line.monthlyAmountUsd * 12, 0);
  const basketTotals = lines.reduce<Record<string, number>>((acc, line) => {
    acc[line.ftcBasket] = (acc[line.ftcBasket] ?? 0) + line.monthlyAmountUsd * 12;
    return acc;
  }, {});

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
      <section className="workspace" aria-labelledby="scenario-title">
        <header className="topbar">
          <div>
            <p className="eyebrow">2026 exploratory estimate</p>
            <h1 id="scenario-title">Tax Treaty Analyzer</h1>
          </div>
          <button className="secondary-button" type="button">
            <Save size={16} aria-hidden="true" />
            Save scenario
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
                <select defaultValue="married_filing_jointly">
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
                <select defaultValue="yes">
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
          <div className="summary-table" role="table" aria-label="Tax estimate summary">
            <div className="summary-row summary-head" role="row">
              <span role="columnheader">Measure</span>
              <span role="columnheader">{countryA[0].toUpperCase() + countryA.slice(1)}</span>
              <span role="columnheader">{countryB[0].toUpperCase() + countryB.slice(1)}</span>
              <span role="columnheader">FTC notes</span>
            </div>
            <div className="summary-row" role="row">
              <span>Annual income modeled</span>
              <strong>{formatUsd(annualIncome)}</strong>
              <strong>{formatUsd(annualIncome)}</strong>
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
              <span>Destination income tax</span>
              <strong>Pending {countryA} rules</strong>
              <strong>Pending {countryB} rules</strong>
              <span>Country-specific module required</span>
            </div>
            <div className="summary-row" role="row">
              <span>Destination social charges</span>
              <strong>Pending {countryA} rules</strong>
              <strong>Pending {countryB} rules</strong>
              <span>Tracked separately from income tax</span>
            </div>
            <div className="summary-row" role="row">
              <span>Foreign tax credit estimate</span>
              <strong>Pending FTC rules</strong>
              <strong>Pending FTC rules</strong>
              <span>Separate passive/general/treaty baskets</span>
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
