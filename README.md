# Tax Treaty Analyzer

Tax Treaty Analyzer is an exploratory planning tool for US citizens comparing estimated tax outcomes when moving or retiring abroad.

The first implementation targets:

- US citizens only
- Texas as the US state
- France, Italy, and Portugal as destination countries
- 2026 tax year
- Monthly income inputs with annualized calculations
- Basket-aware foreign tax credit modeling
- Public, no-login estimates

This is not tax advice. The app is designed to produce approximate, explainable estimates and conservative advisor-review flags.

## Stack

| Layer | Choice |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | FastAPI |
| Database | Neon Postgres |
| Auth | Deferred |
| Deployment | Render, frontend at app root and API under `/api` |

## Local Development

Install dependencies after creating local environments.

```bash
cd frontend
npm install
npm run dev
```

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

On macOS, prefer Homebrew for system packages. Python package installation remains project-local inside the virtual environment.

## Project Notes

- Do not commit `.env` or other secret-bearing files.
- 2026 country and treaty rules must be source-validated before production use.
- Calculation snapshots should be saved only if scenario persistence is added later.
