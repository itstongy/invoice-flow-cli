# AU Compliance Behavior in This Tool

This generator enforces a practical AU-focused rule set for invoice automation.

## 1. Invoice Label

- `gstEnabled=false` -> label `Invoice`
- `gstEnabled=true` -> label `Tax Invoice`

## 2. GST Defaults

- GST is off by default.
- GST can be enabled per invoice.

## 3. ABN Checks

- Seller ABN missing while GST enabled -> validation error.
- Seller/client ABN format checksum failures -> validation warning.

## 4. Recipient Details for >= AUD 1,000 (GST enabled)

For GST-enabled invoices where total estimate is >= AUD 1,000, validation requires:
- recipient identity (client name), and
- recipient address or ABN.

## 5. Validation Outputs

Validation returns machine-readable output with:
- `valid`
- `errors[]`
- `warnings[]`
- `compliance_flags[]`

If hard errors exist, generation should be treated as failed.
