# France-US Tax Rules Reference for Tax Treaty Analyzer

Last reviewed: 2026-10-06

This document is a product reference for the France module of Tax Treaty Analyzer. It summarizes the France/US treatment needed for an exploratory estimate for US citizens considering French tax residence. It is not personalized tax advice and should not be used as a substitute for a French/US cross-border tax adviser.

## Scope

Current app income types:

- US employer salary
- Local employer salary
- Self-employment
- 401(k)
- Traditional IRA
- Roth IRA
- Pension
- Social Security
- Brokerage dividends
- Long-term capital gains
- Rental income
- Qualified 529 withdrawal for child

Backend-adjacent or future-supported variants already reflected in the France calculator logic:

- Interest
- Short-term capital gains
- Crypto gains
- Annuity
- Unknown/other income type

## Core Assumptions

| Topic | Working rule for v1 | Source / implementation note |
|---|---|---|
| User citizenship | User is a US citizen, so the US generally taxes worldwide income even while resident abroad. | IRS Publication 54 says US citizens and resident aliens are subject to US tax on worldwide income. [IRS Pub. 54](https://www.irs.gov/publications/p54) |
| Destination tax residence | User must decide whether they are French tax resident outside the app. | France residence tests and tie-breakers are fact-sensitive; app should ask only for the user assumption. |
| Currency | Current v1 assumes USD = EUR. | Must be replaced with annual FX or user-provided FX. |
| Tax year | Current v1 focuses on 2026 filing / 2025 French income-year references where official French 2026 income-tax schedules are published. | France sources label the 2026 return as applied to 2025 income. [Service-Public income tax calculation](https://www.service-public.fr/particuliers/vosdroits/F34328) |
| Texas state tax | Texas has no individual state income tax, so v1 Texas state income tax is modeled as $0. | App should keep state module separate for future states. |
| Legal posture | Conservative estimates; Roth, pension, Social Security, treaty resourcing, and social charges require advisor review. | Treaty classification can change results materially. |

## Current 2026 France Reference Rates

### French Progressive Income Tax

France applies progressive income tax by household parts, not simply by gross income. Current app v1 does not yet fully model quotient familial.

| Fraction of taxable income per part | Rate | Source |
|---:|---:|---|
| Up to EUR 11,497 | 0% | [impots.gouv.fr progressive brackets](https://www.impots.gouv.fr/particulier/questions/comment-calculer-mon-taux-dimposition-dapres-le-bareme-progressif-de-limpot) |
| EUR 11,498 to EUR 29,315 | 11% | [impots.gouv.fr progressive brackets](https://www.impots.gouv.fr/particulier/questions/comment-calculer-mon-taux-dimposition-dapres-le-bareme-progressif-de-limpot) |
| EUR 29,316 to EUR 83,823 | 30% | [impots.gouv.fr progressive brackets](https://www.impots.gouv.fr/particulier/questions/comment-calculer-mon-taux-dimposition-dapres-le-bareme-progressif-de-limpot) |
| EUR 83,824 to EUR 180,294 | 41% | [impots.gouv.fr progressive brackets](https://www.impots.gouv.fr/particulier/questions/comment-calculer-mon-taux-dimposition-dapres-le-bareme-progressif-de-limpot) |
| Over EUR 180,294 | 45% | [impots.gouv.fr progressive brackets](https://www.impots.gouv.fr/particulier/questions/comment-calculer-mon-taux-dimposition-dapres-le-bareme-progressif-de-limpot) |

Note: Some French 2026 sources also show later indexed thresholds for 2025 income. The app must pin a tax-year data file and source date rather than hardcoding rules in UI copy.

### French Investment Income / Capital Gains

| Component | Rate | Applies to | Source |
|---|---:|---|---|
| PFU income-tax component | 12.8% | Dividends, interest, and securities gains by default, unless progressive option is elected. | [impots.gouv.fr revenus mobiliers](https://www.impots.gouv.fr/particulier/les-revenus-mobiliers), [impots.gouv.fr securities gains](https://www.impots.gouv.fr/particulier/questions/jai-realise-une-plus-value-mobiliere-comment-est-elle-imposee) |
| Social charges total for 2025 income assessed in 2026 | 18.6% | Movable income / securities gains not otherwise exempt. | [impots.gouv.fr revenus mobiliers](https://www.impots.gouv.fr/particulier/les-revenus-mobiliers) |
| CSG component | 10.6% in current v1 sources for certain 2026-assessed income | Social-charge base, category-specific. | [impots.gouv.fr rental social charges](https://www.impots.gouv.fr/particulier/questions/je-donne-un-bien-en-location-dois-je-payer-des-prelevements-sociaux) |
| CRDS component | 0.5% | Social-charge base, category-specific. | [impots.gouv.fr rental social charges](https://www.impots.gouv.fr/particulier/questions/je-donne-un-bien-en-location-dois-je-payer-des-prelevements-sociaux) |
| Prélèvement de solidarité | 7.5% | Social-charge base, category-specific. | [impots.gouv.fr rental social charges](https://www.impots.gouv.fr/particulier/questions/je-donne-un-bien-en-location-dois-je-payer-des-prelevements-sociaux) |

### French Pension / Replacement Income Social Charges

| Component | Working rule | Source |
|---|---|---|
| CSG on pensions | Possible rates include exemption, 3.8%, 6.6%, and 8.3%, depending on reference taxable income and household facts. | [Service-Public CSG/CRDS](https://www.service-public.fr/particuliers/vosdroits/F2971) |
| CRDS on pensions | 0.5% when applicable. | [Service-Public CSG/CRDS](https://www.service-public.fr/particuliers/vosdroits/F2971) |
| CASA | 0.3% on certain retirement, disability pension, and pre-retirement benefits when applicable; not due when exempt or subject only to reduced CSG. | [Service-Public CASA](https://www.service-public.fr/particuliers/vosdroits/F31408) |

App rule: do not automatically apply pension CSG/CRDS/CASA to US retirement income until the pension classification and French social-security/health affiliation facts are modeled.

### French Self-Employment Social Contributions

| Activity category | Current reference rate | Source |
|---|---:|---|
| Micro-BIC services | 21.2% of turnover | [economie.gouv.fr micro-enterprise contributions](https://www.economie.gouv.fr/entreprises/gerer-sa-micro-entreprise/micro-entreprises-quel-est-le-montant-de-vos-cotisations-sociales) |
| Micro-BNC non-regulated liberal activity | 25.6% of turnover | [Service-Public Entreprendre micro-entrepreneur contributions](https://entreprendre.service-public.gouv.fr/vosdroits/F36232) |
| Regulated liberal activity under Cipav | 23.2% of turnover | [economie.gouv.fr micro-enterprise contributions](https://www.economie.gouv.fr/entreprises/gerer-sa-micro-entreprise/micro-entreprises-quel-est-le-montant-de-vos-cotisations-sociales) |

App rule: do not reduce self-employment to one rate. Ask or infer activity category before calculating.

## Current 2026 US Reference Rules

| Topic | Working rule | Source |
|---|---|---|
| Ordinary income | US citizens abroad remain subject to US tax on worldwide income. Ordinary income includes wages, taxable retirement distributions, nonqualified dividends, short-term gains, taxable rental income, and taxable Social Security benefits. | [IRS Pub. 54](https://www.irs.gov/publications/p54), [IRS Social Security FAQ](https://www.irs.gov/faqs/social-security-income), [IRS Topic 409](https://www.irs.gov/taxtopics/tc409) |
| Foreign earned income exclusion | FEIE may apply to qualifying foreign earned income, but choosing exclusion can reduce or eliminate FTC on excluded income. | [IRS Pub. 54](https://www.irs.gov/publications/p54), [IRS FEIE](https://www.irs.gov/individuals/international-taxpayers/foreign-earned-income-exclusion-what-is-foreign-earned-income) |
| Long-term capital gains | Long-term gains and qualified dividends use preferential capital-gain rates; short-term gains are ordinary income. | [IRS Topic 409](https://www.irs.gov/taxtopics/tc409), [IRS Topic 404](https://www.irs.gov/taxtopics/tc404) |
| Rental income | Rental income is reportable; expenses and depreciation may be deductible depending on facts. | [IRS Pub. 527](https://www.irs.gov/publications/p527) |
| 529 qualified distribution | No US tax due if QTP/529 distribution does not exceed adjusted qualified education expenses. | [IRS Pub. 970](https://www.irs.gov/publications/p970), [IRS Topic 313](https://www.irs.gov/taxtopics/tc313) |
| Social Security | Taxable portion depends on total income and filing status; up to 85% can be taxable under US domestic law. | [IRS Pub. 915](https://www.irs.gov/publications/p915), [IRS Social Security FAQ](https://www.irs.gov/faqs/social-security-income) |
| Traditional IRA / 401(k) | Generally ordinary income when distributed, except basis/rollover/special cases. | [IRS Pub. 590-B](https://www.irs.gov/publications/p590b) |
| Roth IRA | Qualified distributions are generally tax free under US rules; nonqualified earnings may be taxable and potentially penalized. | [IRS Pub. 590-B](https://www.irs.gov/publications/p590b) |

## Foreign Tax Credit and Treaty Relief

The FTC module should be basket-aware, treaty-aware, and source-aware.

| Rule | Product implication | Source |
|---|---|---|
| FTC is generally limited to the smaller of foreign tax paid/accrued or US tax attributable to foreign-source income. | Estimate both US pre-credit tax and allowable FTC; do not simply subtract all French tax from US tax. | [IRS Topic 856](https://www.irs.gov/taxtopics/tc856) |
| FTC limitations are computed separately by category. | App must maintain baskets: passive, general, treaty-resourced, and unknown/review. | [IRS Instructions for Form 1116](https://www.irs.gov/instructions/i1116) |
| Passive category includes many investment items, but high-taxed passive income can be reclassified under HTKO rules. | Future Form 1116 engine needs HTKO and preferential-rate adjustments. | [IRS Form 1116 Instructions](https://www.irs.gov/instructions/i1116), [IRS FTC compliance tips](https://www.irs.gov/individuals/international-taxpayers/foreign-tax-credit-compliance-tips) |
| Treaty-resourced income requires separate treatment. | US-source income taxed by France may need a separate treaty-resourced Form 1116 category. | [IRS Pub. 514](https://www.irs.gov/publications/p514), [IRS Form 1116 Instructions](https://www.irs.gov/instructions/i1116) |
| FEIE and FTC interact. | If income is excluded on Form 2555, foreign taxes allocable to excluded income generally cannot also be credited. | [IRS Pub. 54](https://www.irs.gov/publications/p54) |
| Social taxes are not automatically income taxes for FTC. | French CSG/CRDS/solidarity/CASA creditability must be separately researched and flagged; app should not assume all social charges are creditable income taxes. | Advisor review; Form 1116 requires foreign taxes to be eligible income taxes. [IRS Form 1116 Instructions](https://www.irs.gov/instructions/i1116) |

## France-US Treaty References

| Treaty topic | Working interpretation for app | Source |
|---|---|---|
| Treaty documents | Use IRS-hosted treaty, protocols, and technical explanations as the primary US-side source. | [IRS France tax treaty documents](https://www.irs.gov/businesses/international-businesses/france-tax-treaty-documents) |
| Pensions and retirement accounts | Treat US retirement distributions as high-review. Classification depends on account type, treaty article, saving clause, and France-side credit/exemption method. | [US-France technical explanation](https://www.irs.gov/pub/irs-trty/francetech.pdf), [2004 protocol technical explanation](https://www.irs.gov/pub/irs-trty/france_te__of_2004_protocol_103-32.pdf) |
| Social Security | Treat US Social Security as treaty-sensitive. App v1 may show “US/payor-state tax; France report/credit/taux-effectif review” rather than automatically applying France ordinary tax. | [US-France technical explanation](https://www.irs.gov/pub/irs-trty/francetech.pdf) |
| Employment / self-employment social security | Separate income tax from social security coverage. The US-France totalization agreement can prevent dual social-security coverage. | [SSA totalization agreement with France](https://www.ssa.gov/international/Agreement_Pamphlets/france.html), [IRS totalization agreements](https://www.irs.gov/government-entities/federal-state-local-governments/totalization-agreements) |

## Treatment Matrix

Legend: “Advisor review” means do not calculate final treatment without more facts. “FTC basket” is a preliminary US Form 1116 category, not a final filing conclusion.

| # | Income source | US ordinary income tax | US capital gains tax | FR ordinary income tax | FR capital gains tax | FR cotisation sociale | FR CSG | FR CRDS | FR prélèvement de solidarité | FR CASA | Preliminary FTC basket / note |
|---:|---|---|---|---|---|---|---|---|---|---|---|
| 1 | US employer salary, work performed in France | Yes, wages are US worldwide income; FEIE may be alternative to FTC. [IRS Pub. 54](https://www.irs.gov/publications/p54) | N/A | Yes if French tax resident and work is performed in France; progressive France tax. [impots.gouv.fr brackets](https://www.impots.gouv.fr/particulier/questions/comment-calculer-mon-taux-dimposition-dapres-le-bareme-progressif-de-limpot) | N/A | Possible French payroll/social coverage depending assignment and totalization certificate. [SSA France agreement](https://www.ssa.gov/international/Agreement_Pamphlets/france.html) | Usually part of French payroll/social contribution system, not the investment-income CSG model. | Usually part of payroll/social contribution system. | N/A | N/A | General basket if FTC used; FEIE alternative needs exclusion interaction. |
| 2 | Local employer salary, work performed in France | Yes, US worldwide income; foreign employer wages may qualify for FEIE/FTC depending facts. [IRS Pub. 54](https://www.irs.gov/publications/p54) | N/A | Yes, employment income in France; progressive tax. [Service-Public calculation](https://www.service-public.fr/particuliers/vosdroits/F34328) | N/A | Usually French payroll/social contributions. | Usually payroll/social system. | Usually payroll/social system. | N/A | N/A | General basket if FTC used; wage withholding and French payroll contributions must be separated. |
| 3 | Self-employment / 1099 contractor income, work performed in France | Yes, ordinary business income; US self-employment tax depends totalization. [IRS totalization agreements](https://www.irs.gov/government-entities/federal-state-local-governments/totalization-agreements) | N/A | Yes, French-source professional income if French tax resident / activity in France. [impots.gouv.fr micro-entrepreneur declaration](https://www.impots.gouv.fr/particulier/questions/comment-declarer-les-revenus-provenant-de-mon-activite-dauto-entrepreneur) | N/A | Yes if in French system; micro-BIC 21.2%, micro-BNC 25.6%, Cipav 23.2% are current reference rates. [economie.gouv.fr](https://www.economie.gouv.fr/entreprises/gerer-sa-micro-entreprise/micro-entreprises-quel-est-le-montant-de-vos-cotisations-sociales) | Usually included in social-contribution regime, not separate in v1. | Usually included. | N/A | N/A | General basket; separate social-security/totalization engine needed. |
| 4 | Traditional 401(k) withdrawal | Yes, generally ordinary income unless basis/rollover exception. [IRS Pub. 590-B](https://www.irs.gov/publications/p590b) | N/A | Advisor review: treaty/account classification and French credit/exemption method required; reportability likely. [IRS France treaty docs](https://www.irs.gov/businesses/international-businesses/france-tax-treaty-documents) | N/A | N/A unless French pension/social-charge rules apply. | Possible only after pension/social-charge facts are known. [Service-Public CSG/CRDS](https://www.service-public.fr/particuliers/vosdroits/F2971) | Possible. | N/A | Possible if pension social-charge rules apply. [Service-Public CASA](https://www.service-public.fr/particuliers/vosdroits/F31408) | General or treaty-resourced review; do not auto-credit without classification. |
| 5 | Traditional IRA withdrawal | Yes, generally ordinary income except basis/rollover cases. [IRS Pub. 590-B](https://www.irs.gov/publications/p590b) | N/A | Advisor review: similar to private pension/retirement treatment but account facts matter. [US-France technical explanation](https://www.irs.gov/pub/irs-trty/francetech.pdf) | N/A | N/A unless French pension/social-charge rules apply. | Possible after pension/social-charge facts. | Possible. | N/A | Possible. | General or treaty-resourced review. |
| 6 | Pension / annuity | Yes if taxable under US domestic law; public/government pensions can differ. [IRS foreign pension guidance](https://www.irs.gov/businesses/the-taxation-of-foreign-pension-and-annuity-distributions) | N/A | Advisor review: public/private pension article, residence, nationality, and credit method matter. [IRS France treaty docs](https://www.irs.gov/businesses/international-businesses/france-tax-treaty-documents) | N/A | N/A unless French social-charge pension rules apply. | Possible rates depend on French reference income and affiliation. [Service-Public CSG/CRDS](https://www.service-public.fr/particuliers/vosdroits/F2971) | Possible. | N/A | Possible at 0.3% if applicable. [Service-Public CASA](https://www.service-public.fr/particuliers/vosdroits/F31408) | General or treaty-resourced review. |
| 7 | Roth IRA withdrawal | US tax-free only if qualified; nonqualified earnings may be taxable/penalized. [IRS Pub. 590-B](https://www.irs.gov/publications/p590b) | N/A | High advisor review; do not assume France follows US Roth tax-free treatment. | N/A | N/A unless treated under pension/social-charge rules. | Advisor review. | Advisor review. | N/A | Advisor review. | Unknown/treaty review; app should preserve high flag. |
| 8 | Social Security | Taxable portion depends on provisional income; up to 85% can be taxable domestically. [IRS Pub. 915](https://www.irs.gov/publications/p915) | N/A | Treaty-sensitive; v1 should show payor-state/treaty relief and reportability review, not ordinary France tax by default. [US-France technical explanation](https://www.irs.gov/pub/irs-trty/francetech.pdf) | N/A | N/A | Possible only if French pension/social-charge rules apply; advisor review. [Service-Public CSG/CRDS](https://www.service-public.fr/particuliers/vosdroits/F2971) | Possible. | N/A | Possible if pension social-charge rules apply. | General or treaty-resourced review; likely special treaty treatment. |
| 9 | Brokerage dividends | Ordinary dividends are US ordinary income; qualified dividends may use capital-gain rates. [IRS Topic 404](https://www.irs.gov/taxtopics/tc404) | Qualified dividends taxed at preferential capital-gain rates; capital gain distributions are long-term gains. [IRS Topic 404](https://www.irs.gov/taxtopics/tc404) | France PFU income-tax component generally 12.8% unless progressive option. [impots.gouv.fr revenus mobiliers](https://www.impots.gouv.fr/particulier/les-revenus-mobiliers) | N/A unless dividend is capital-gain distribution / sale proceeds. | N/A | Yes under domestic social-charge model if taxable in France. [impots.gouv.fr revenus mobiliers](https://www.impots.gouv.fr/particulier/les-revenus-mobiliers) | Yes. | Yes. | N/A | Passive basket; FTC preferential-rate adjustment may be needed. |
| 10 | Interest / savings interest | Yes, ordinary income. [IRS Pub. 550](https://www.irs.gov/publications/p550) | N/A | France PFU / progressive option for interest-like movable income. [impots.gouv.fr revenus mobiliers](https://www.impots.gouv.fr/particulier/les-revenus-mobiliers) | N/A | N/A | Yes under domestic social-charge model if taxable in France. | Yes. | Yes. | N/A | Passive basket. |
| 11 | Savings account principal withdrawals | N/A for return of principal; interest remains taxable separately. [IRS Pub. 550](https://www.irs.gov/publications/p550) | N/A | N/A for return of principal; interest/gain component can be taxable. | N/A | N/A | N/A on principal. | N/A | N/A | N/A | Not applicable for principal; passive for interest. |
| 12 | Long-term brokerage capital gains | N/A as ordinary income unless short-term or special recapture. | Yes; long-term gains taxed under US capital-gain regime. [IRS Topic 409](https://www.irs.gov/taxtopics/tc409) | N/A as ordinary income unless progressive option affects computation. | Yes under French domestic PFU: 12.8% income tax + social charges, unless progressive option. [impots.gouv.fr securities gains](https://www.impots.gouv.fr/particulier/questions/jai-realise-une-plus-value-mobiliere-comment-est-elle-imposee) | N/A | Yes. | Yes. | Yes. | N/A | Passive basket; Form 1116 capital-gain adjustment may apply. |
| 13 | Short-term capital gains | Yes, net short-term gains are US ordinary income. [IRS Topic 409](https://www.irs.gov/taxtopics/tc409) | Not preferential long-term capital gains. | France generally uses securities gain framework, not US short/long distinction. | Yes under French domestic PFU/progressive option. [impots.gouv.fr securities gains](https://www.impots.gouv.fr/particulier/questions/jai-realise-une-plus-value-mobiliere-comment-est-elle-imposee) | N/A | Yes. | Yes. | Yes. | N/A | Passive basket. |
| 14 | Crypto gains | US treatment depends facts; capital gain if capital asset, ordinary if business/mining/rewards. | Possible capital gain treatment when disposed of as capital asset. | France classification must be modeled separately; do not reuse securities blindly without review. | Possible capital-gain / digital-asset rules; advisor review. | N/A unless professional activity. | Possible. | Possible. | Possible. | N/A | Passive or general depending character; advisor review. |
| 15 | Real estate rental income | Yes if US taxpayer has rental income; expenses/depreciation may offset. [IRS Pub. 527](https://www.irs.gov/publications/p527) | N/A unless sale of property. | Depends on property location; real property situs country typically has primary taxing right and France may tax/credit/report depending treaty. | N/A unless sale. | N/A unless professional furnished rental/social regime applies. | Yes for French rental income; US rental requires treaty/credit handling. [impots.gouv.fr rental social charges](https://www.impots.gouv.fr/particulier/questions/je-donne-un-bien-en-location-dois-je-payer-des-prelevements-sociaux) | Yes for French rental income. | Yes for French rental income. | N/A | Passive basket for rental income; source and property location required. |
| 16 | Qualified 529 withdrawal for child | N/A if qualified distribution does not exceed adjusted qualified education expenses. [IRS Pub. 970](https://www.irs.gov/publications/p970) | N/A | v1 assumption: N/A for qualified child-beneficiary education withdrawal, but France-specific treatment is not clearly codified; advisor review. | N/A | N/A | N/A | N/A | N/A | N/A | Not applicable in v1; preserve advisor note. |
| 17 | Unknown/other income type | Unknown; classify before calculation. | Unknown. | Unknown. | Unknown. | Unknown. | Unknown. | Unknown. | Unknown. | Unknown. | Unknown; force advisor review. |

## Implementation Guidance

1. Keep the treatment matrix separate from the numeric estimate table.
2. Use row-level income characterization before rates: source country, work location, account type, qualified/nonqualified status, property location, and French social-security affiliation.
3. Do not treat French social charges as one universal tax. Components and applicability differ by income category.
4. Do not treat all French social charges as FTC-creditable US income taxes.
5. Maintain Form 1116 baskets on every income row:
   - General: wages, self-employment, pension-like ordinary income when foreign-source/treaty-relevant.
   - Passive: dividends, interest, rental, capital gains, many investment items.
   - Treaty-resourced: US-source income re-sourced under treaty for FTC purposes.
   - Not applicable: principal withdrawals and qualified 529 withdrawals in v1.
   - Unknown: anything not mapped.
6. Preserve advisor-review flags for:
   - Roth IRA
   - 401(k), IRA, pensions, annuities
   - Social Security
   - French social charges on pension-like income
   - Treaty-resourced FTC
   - Crypto
   - Rental regime classification

## Deferred Improvements

| Improvement | Why it matters |
|---|---|
| Full Form 1116 engine | FTC is the critical driver for US citizens resident in France. Basket-level limits, re-sourcing, carryovers, HTKO, capital-gain adjustments, and FEIE interaction are required for credibility. |
| France quotient familial | French household parts can materially change progressive tax. |
| France exchange-rate engine | French tax is EUR-denominated; app inputs are USD. |
| Pension/social-charge questionnaire | Needed before applying CSG/CRDS/CASA to retirement income. |
| Totalization/social-security coverage module | Needed for salary/self-employment social contributions and US SE tax. |
| Rental regime module | Furnished/unfurnished, professional/nonprofessional, micro/real, property location, and depreciation change results. |
| Source-country engine | US-source vs French-source vs third-country source controls FTC and treaty treatment. |
| Tax-year data files | Rules should be versioned by tax year rather than hardcoded. |

