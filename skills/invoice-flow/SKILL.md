---
name: invoice-flow
description: Generate, validate, and preview modern Australian invoices and quotes as PDFs using a strict JSON contract with optional plain-text parsing. Use when a user needs agent-friendly invoice automation with machine-readable artifacts.
---

# Invoice Flow Skill

## Overview

Use this skill from the project root. If needed, set:
`INVOICE_FLOW_DIR=/absolute/path/to/invoice-flow-cli`

The generator produces three output artifacts per run:
- invoice mode: `invoice.pdf`, `invoice.normalized.json`, `invoice.validation.json`
- quote mode: `quote.pdf`, `quote.normalized.json`, `quote.validation.json`

## Workflow

1. Confirm profile path.
- Example profile for docs/tests: `profiles/business.profile.example.json`
- Real usage: create/use private profile JSON (commonly `profiles/business.profile.json`).

2. Validate before generating PDF.
- Run:
```bash
bash skills/invoice-flow/scripts/run_invoice_flow.sh validate \
  --input <path-or-text> \
  --profile <profile-path> \
  --type <invoice|quote>
```
- If validation fails, fix input and re-run.

3. Generate artifacts.
- Run:
```bash
bash skills/invoice-flow/scripts/run_invoice_flow.sh generate \
  --input <path-or-text> \
  --profile <profile-path> \
  --out <output-dir> \
  --type <invoice|quote>
```

4. Optional HTML preview.
- Run:
```bash
bash skills/invoice-flow/scripts/run_invoice_flow.sh preview \
  --input <path-or-text> \
  --profile <profile-path> \
  --out <output-dir> \
  --type <invoice|quote>
```

## Input Contract

Use strict JSON when possible. See `references/schema.md`.

Plain text is supported as fallback with key/value lines and item rows:
```text
client: Alex Morgan
issue date: 2026-02-25
due date: 2026-03-04
gst: false
- Portrait session | 1 | 650 | false
```

## Compliance Rules

See `references/au-compliance.md` for the exact behavior enforced by the validator.

## Notes for Agents

- Prefer JSON input to avoid parse ambiguity.
- Always inspect `invoice.validation.json` even when PDF generation succeeds.
- If GST is false, invoice label must be `Invoice`.
- If GST is true, invoice label must be `Tax Invoice`.
- If type is quote, label must be `Quote` and output file base must be `quote.*`.
