# Architecture

## Product Scope

| Area | Decision |
|---|---|
| User | US citizens considering moving or retiring abroad |
| State | Texas |
| Countries | France, Italy, Portugal |
| Tax year | 2026 |
| Currency | USD |
| Income cadence | Monthly inputs, annualized internally |
| Cost of living | Separate future module |
| Legal posture | Approximate estimates with conservative advisor-review flags |

## Application Structure

| Layer | Responsibility |
|---|---|
| Frontend | Scenario form, income lines, deduction inputs, results table, auth screens |
| Backend API | Auth, scenario persistence, calculation orchestration, exports |
| Database | Users, scenarios, inputs, calculation snapshots |
| Calculation modules | US federal/Texas, destination-country logic, FTC baskets |
| Country modules | France-specific, Italy-specific, Portugal-specific treatment |

## Deployment Pattern

Production should keep the frontend and backend aligned under one app domain:

| Route | Purpose |
|---|---|
| `https://tax-treaty-analyzer.onrender.com` | Frontend app |
| `https://tax-treaty-analyzer.onrender.com/api` | Backend API |

This follows the established desktop/mobile consistency pattern.

## Form 1116 / FTC Approach

The MVP uses a basket-aware estimate:

| Basket | MVP Handling |
|---|---|
| Passive | Track income and foreign tax by basket |
| General | Track income and foreign tax by basket |
| Treaty-resourced | Track separately and flag for review |
| Foreign branch | Advanced, advisor-review |
| GILTI / 951A | Advanced, advisor-review |
| Lump-sum distributions | Advanced, advisor-review |

The calculation model should support later migration to a fuller Form 1116-style engine.

## Design Contract

| Field | Decision |
|---|---|
| Screen job | Create a tax scenario and compare estimated US vs destination-country tax impact |
| Primary user/action | US citizen entering income and residency assumptions to inspect after-tax outcomes |
| Information hierarchy | Destination/profile first, income lines second, estimated results and flags third |
| Workflow shape | Create, validate, compare, save |
| Primary action | Calculate estimate |
| Navigation/control model | App shell with tabs for Scenario, Results, and later Cost of Living |
| Density | Standard-to-compact because this is a financial planning workflow |
| Visual language | Quiet product UI, strong tables/forms, limited accent color, tabular numerics |
| Required states | Empty, validation error, loading, saved, calculation unavailable, advisor review |
| Responsive behavior | Desktop split workflow, mobile stacked sections with horizontally scrollable result tables |
| Forbidden defaults | Marketing hero page, generic dashboard cards, unsupported tax precision |

