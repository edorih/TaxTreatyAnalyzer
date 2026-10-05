# Project Writeup

## What We Built

We started a greenfield Tax Treaty Analyzer for US citizens comparing tax outcomes across France, Italy, and Portugal. The current direction is a public, no-login estimator with basket-aware foreign tax credit inputs and a side-by-side tax comparison workflow. The app is structured to separate tax estimation from future cost-of-living analysis.

## Why It Is Interesting And Valuable

The project addresses a real planning gap for US citizens considering retirement or relocation abroad. The value comes from making treaty-driven tax complexity more legible without pretending to replace professional advice. It is especially useful because US worldwide taxation, destination-country taxation, and foreign tax credits interact in non-obvious ways.

## How It Was Built

The planned stack is React, TypeScript, Vite, and FastAPI, with Neon Postgres deferred unless scenario persistence returns. The architecture separates shared calculation plumbing from country-specific tax rule modules. The calculation layer is designed to preserve explainability through assumptions, confidence levels, and advisor-review flags.
