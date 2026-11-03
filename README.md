# Tax Notice Triage (India s.143(1)(a) · US CP2000)

A design brief and clickable mock for an AI-assisted system that helps a qualified practitioner respond to automated income-tax mismatch notices.

**Core idea:** the notice came from a deterministic matcher, so the system first *reproduces the notice's figures* from the taxpayer's own documents. It then accepts an LLM-proposed explanation only if the cited records close the variance to **exactly zero**. The LLM reads, labels and writes; code does all arithmetic and applies all rules; a human signs off and files.

## Contents

| Path | What |
|---|---|
| `brief.md` / `brief.pdf` | The 4-page brief |
| `appendix.md` / `appendix.pdf` | One-page "what I added beyond the AI" |
| `llm-logs.zip` | Claude Code transcripts (raw JSONL + readable Markdown) and the approved plan |
| `architecture.svg` | Diagram: human / deterministic / LLM lanes |
| `mock/index.html` | Clickable mock: open in any browser, no build or server |
| `mock/cases.js` | 12 synthetic test cases (all data made up) |
| `mock/rules.js` | Versioned, effective-dated rules table (where the tax knowledge lives) |
| `examples/results.md` | Results for each case, including the 2 failures |

## Running the mock

```
open mock/index.html          # macOS; or double-click the file
```
It works from `file://` and from GitHub Pages. Pick a case on the left and click any grey `doc:L` tag to see the exact source line. The **Stop reusing evidence** toggle (top right, the evidence-ledger guard) switches between v1 and the proposed v2 fix (see US-05). You can link straight to a case with `index.html#US-05`.

## What is real and what is canned

- **Live (deterministic JS):** extraction validation, notice reproduction (payer + category matcher), rules engine (closed taxonomy, effective dates, required evidence, conflicts), evidence-ledger guard, citation resolution, and tracing each amount in the draft back to its source.
- **Canned (no model called):** the LLM outputs, meaning extracted line items, cause proposals and drafts, are written by hand as fixtures in `cases.js`. **No LLM was used at runtime.** In a working version, these would be structured-output calls to a free OpenRouter model, with the same JSON shapes.

## Test cases

6 India + 6 US, covering: duplicate AIS reporting, income under a different head, accrual vs receipt with a TDS-credit conflict, wrong-PAN attribution, a repealed exemption, an unreadable scan, a 1099-B with missing basis, 1099-K reimbursements with a residue, a payer renamed by merger, an omitted 1099-NEC, evidence reuse across two funds, and a 1099-G that depends on the prior year. Result: **10/12 correct, 2 wrong in v1** (US-04, US-05). Details are in `examples/results.md`.

## Data

All names, identifiers, amounts and documents are **synthetic**. No real taxpayer or client data was used.
