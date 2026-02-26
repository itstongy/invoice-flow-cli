# Invoice Schema Reference

## Profile JSON (required)

Required keys:
- `legalName`
- `email`
- `phone`
- `address`
- `defaultTermsDays`
- `payment.bankName`
- `payment.accountName`
- `payment.bsb`
- `payment.accountNumber`
- `payment.payId`

Common optional keys:
- `businessName`
- `abn`
- `website`
- `logoPath`
- `currency` (default `AUD`)
- `notesFooter`
- `sequenceStatePath`

## Invoice Input JSON (required)

Required keys:
- `client.name`
- `issueDate` (YYYY-MM-DD)
- `dueDate` (YYYY-MM-DD)
- `lineItems[]`

Line item required keys:
- `description`
- `quantity`
- `unitPrice`

Common optional keys:
- `invoiceNumber` (auto-generated if absent)
- `gstEnabled` (default false)
- `currency` (default from profile or `AUD`)
- `session.type`
- `session.shootDate`
- `session.location`
- `notes`
- `payment.termsDays`
- `payment.reference`

## Output Files

`generate` writes:
- `invoice.pdf`
- `invoice.normalized.json`
- `invoice.validation.json`
