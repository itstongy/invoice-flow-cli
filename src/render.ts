import fs from "node:fs";
import path from "node:path";
import { BusinessProfile, InvoiceNormalized } from "./types";
import { escapeHtml, formatCurrency } from "./utils";

function maybeLogo(logoPath?: string): string {
  if (!logoPath) return "";
  const resolved = path.resolve(process.cwd(), logoPath);
  if (!fs.existsSync(resolved)) return "";
  const ext = path.extname(resolved).toLowerCase();
  const mime =
    ext === ".svg"
      ? "image/svg+xml"
      : ext === ".png"
        ? "image/png"
        : ext === ".webp"
          ? "image/webp"
          : "image/jpeg";
  const data = fs.readFileSync(resolved).toString("base64");
  return `<img class=\"brand-logo\" src=\"data:${mime};base64,${data}\" alt=\"Business logo\" />`;
}

export function renderInvoiceHtml(profile: BusinessProfile, invoice: InvoiceNormalized): string {
  const isQuote = invoice.documentType === "quote";
  const rows = invoice.lineItems
    .map(
      (item, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${escapeHtml(item.description)}</td>
        <td>${item.quantity}</td>
        <td>${formatCurrency(item.unitPrice, invoice.currency)}</td>
        <td>${item.taxable ? "Yes" : "No"}</td>
        <td>${formatCurrency(item.lineTotal, invoice.currency)}</td>
      </tr>`
    )
    .join("\n");

  const businessName = profile.businessName ?? profile.legalName;
  const docLabel = isQuote ? "Quote" : invoice.invoiceLabel;
  const paymentCardTitle = "Payment";
  const totalLabel = isQuote ? "Estimated Total" : "Total Due";
  const topNotice = isQuote
    ? '<div class="doc-warning">QUOTE</div>'
    : invoice.invoiceLabel === "Tax Invoice"
      ? '<div class="doc-note">TAX INVOICE</div>'
      : "";

  return `<!doctype html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
  <title>${escapeHtml(invoice.invoiceNumber)}</title>
  <style>
    :root {
      --ink: #131417;
      --soft-ink: #4f5560;
      --line: #d5e3dc;
      --paper: #f2f8f5;
      --accent: #1f5a45;
      --accent-soft: #e8f4ef;
      --quote-accent: #1f5a45;
      --quote-soft: #e8f4ef;
      --quote-warn: #2d7a5b;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Avenir Next", "Helvetica Neue", Helvetica, Arial, sans-serif;
      color: var(--ink);
      background: var(--paper);
      padding: 18px;
    }
    .sheet {
      max-width: 850px;
      margin: 0 auto;
      background: white;
      border-radius: 18px;
      padding: 30px;
      box-shadow: 0 16px 38px rgba(16, 16, 20, 0.08);
      position: relative;
      overflow: hidden;
    }
    .sheet.quote {
      border: 2px solid rgba(31, 90, 69, 0.16);
      background: linear-gradient(180deg, #fff 0%, #fff 62%, #f4faf7 100%);
    }
    .quote-watermark {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: rotate(-24deg);
      font-size: 112px;
      font-weight: 800;
      letter-spacing: 0.2em;
      color: rgba(31, 90, 69, 0.1);
      white-space: nowrap;
      pointer-events: none;
      user-select: none;
      z-index: 2;
    }
    .sheet > * { position: relative; z-index: 1; }
    .doc-warning {
      display: inline-block;
      margin-bottom: 10px;
      background: var(--quote-warn);
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.14em;
      padding: 6px 9px;
      border-radius: 999px;
      text-transform: uppercase;
    }
    .doc-note {
      display: inline-block;
      margin-bottom: 10px;
      background: var(--accent-soft);
      color: var(--accent);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.14em;
      padding: 6px 9px;
      border-radius: 999px;
      text-transform: uppercase;
    }
    .topbar {
      display: grid;
      grid-template-columns: 1.6fr 1fr;
      gap: 24px;
      border-bottom: 1px solid var(--line);
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    .brand-logo {
      max-height: 66px;
      margin-bottom: 12px;
      object-fit: contain;
    }
    .label {
      letter-spacing: 0.16em;
      font-size: 12px;
      text-transform: uppercase;
      color: ${isQuote ? "var(--quote-accent)" : "var(--accent)"};
      font-weight: 700;
      margin-bottom: 8px;
    }
    h1 {
      margin: 0 0 6px 0;
      font-size: 42px;
      line-height: 1;
      letter-spacing: -0.03em;
    }
    .sub {
      color: var(--soft-ink);
      font-size: 13px;
      line-height: 1.4;
      white-space: pre-line;
    }
    .meta-card {
      background: linear-gradient(180deg, #fff 0%, ${isQuote ? "var(--quote-soft)" : "var(--accent-soft)"} 100%);
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 13px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      border-bottom: 1px solid rgba(16,16,20,0.08);
      padding: 7px 0;
      font-size: 13px;
    }
    .meta-row:last-child { border-bottom: 0; }
    .meta-row span { color: var(--soft-ink); }
    .section-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 18px;
    }
    .card {
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 13px;
      min-height: 112px;
      background: #fff;
    }
    .card h3 {
      margin: 0 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: ${isQuote ? "var(--quote-accent)" : "var(--soft-ink)"};
      font-size: 11px;
      font-weight: 700;
    }
    .card .body { font-size: 13px; line-height: 1.5; white-space: pre-line; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 12px;
      border: 1px solid var(--line);
      border-radius: 12px;
      overflow: hidden;
    }
    thead th {
      text-align: left;
      background: ${isQuote ? "#e8f4ef" : "#e8f4ef"};
      border-bottom: 1px solid var(--line);
      padding: 9px;
      color: ${isQuote ? "var(--quote-accent)" : "var(--accent)"};
      font-size: 10px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    tbody td {
      padding: 9px;
      border-bottom: 1px solid #eef1f5;
      vertical-align: top;
    }
    tbody tr:last-child td { border-bottom: 0; }
    .finance-row {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 16px;
      margin-top: 12px;
      align-items: start;
    }
    .finance-row.quote {
      grid-template-columns: 1fr 1fr;
    }
    .finance-row.quote .totals {
      width: 100%;
      max-width: none;
      margin-left: 0;
    }
    .finance-spacer {
      min-height: 1px;
    }
    .totals {
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 9px 11px;
      background: ${isQuote ? "#edf7f2" : "#fff"};
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 7px 0;
      border-bottom: 1px solid #eef1f5;
      font-size: 13px;
    }
    .total-row:last-child {
      border-bottom: 0;
      font-size: 19px;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: ${isQuote ? "var(--quote-accent)" : "var(--ink)"};
    }
    .footer {
      margin-top: 18px;
      padding-top: 12px;
      border-top: 1px dashed var(--line);
      color: var(--soft-ink);
      font-size: 11px;
      line-height: 1.5;
      white-space: pre-line;
    }
    @page {
      size: A4;
      margin: 6mm;
    }
    @media print {
      body { background: white; padding: 0; }
      .sheet { box-shadow: none; border-radius: 0; max-width: none; padding: 2mm; }
      .quote-watermark { display: none; }
      .topbar { gap: 18px; padding-bottom: 15px; margin-bottom: 15px; }
      h1 { font-size: 39px; margin-bottom: 4px; }
      .label { margin-bottom: 5px; font-size: 12.5px; }
      .sub { font-size: 13.5px; }
      .brand-logo { max-height: 52px; margin-bottom: 9px; }
      .meta-row { font-size: 13.5px; padding: 8px 0; }
      .section-grid { gap: 12px; margin-bottom: 12px; }
      .card { padding: 11px; min-height: auto; }
      .card h3 { margin-bottom: 6px; }
      .card .body { font-size: 13px; line-height: 1.42; }
      table { margin-top: 8px; font-size: 12px; }
      thead th, tbody td { padding: 7px; }
      .finance-row { gap: 12px; margin-top: 10px; }
      .totals { padding: 8px 10px; }
      .total-row { padding: 6px 0; }
      .total-row:last-child { font-size: 19px; }
      .footer { margin-top: 9px; padding-top: 8px; font-size: 10.5px; line-height: 1.35; }
      .section-grid { grid-template-columns: 1fr 1fr; }
      .finance-row { grid-template-columns: 1fr 320px; }
    }
    @media screen and (max-width: 760px) {
      .topbar, .section-grid, .finance-row {
        grid-template-columns: 1fr;
      }
      .totals {
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class=\"sheet ${isQuote ? "quote" : "invoice"}\">
    ${isQuote ? '<div class="quote-watermark">QUOTE</div>' : ""}
    <section class=\"topbar\">
      <div>
        ${maybeLogo(profile.logoPath)}
        ${topNotice}
        <div class=\"label\">${escapeHtml(docLabel)}</div>
        <h1>${escapeHtml(invoice.invoiceNumber)}</h1>
        <div class=\"sub\">${escapeHtml(businessName)}
${escapeHtml(profile.address)}
${escapeHtml(profile.abn ? `ABN: ${profile.abn}` : "")}</div>
      </div>
      <div class=\"meta-card\">
        <div class=\"meta-row\"><span>Issue Date</span><strong>${escapeHtml(invoice.issueDate)}</strong></div>
        <div class=\"meta-row\"><span>${escapeHtml(invoice.dateLabel)}</span><strong>${escapeHtml(invoice.dateValue)}</strong></div>
        <div class=\"meta-row\"><span>Currency</span><strong>${escapeHtml(invoice.currency)}</strong></div>
        <div class=\"meta-row\"><span>GST Included</span><strong>${invoice.gstEnabled ? "Yes" : "No"}</strong></div>
      </div>
    </section>

    <section class=\"section-grid\">
      <div class=\"card\">
        <h3>${isQuote ? "Prepared For" : "Billed To"}</h3>
        <div class=\"body\">${escapeHtml(invoice.client.name)}
${escapeHtml(invoice.client.address ?? "")}
${escapeHtml(invoice.client.email ?? "")}
${escapeHtml(invoice.client.phone ?? "")}
${escapeHtml(invoice.client.abn ? `ABN: ${invoice.client.abn}` : "")}</div>
      </div>
      <div class=\"card\">
        <h3>From</h3>
        <div class=\"body\">${escapeHtml(profile.legalName)}
${escapeHtml(profile.address)}
${escapeHtml(profile.abn ? `ABN: ${profile.abn}` : "")}
${escapeHtml(profile.email)}
${escapeHtml(profile.phone)}
${escapeHtml(profile.website ?? "")}</div>
      </div>
    </section>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Description</th>
          <th>Qty</th>
          <th>Unit</th>
          <th>Taxable</th>
          <th>Line Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <section class=\"finance-row ${isQuote ? "quote" : ""}\">
      ${
        isQuote
          ? `<div class=\"finance-spacer\" aria-hidden=\"true\"></div>`
          : `<div class=\"card\">
        <h3>${paymentCardTitle}</h3>
        <div class=\"body\">${escapeHtml(profile.payment.bankName)}
Account Name: ${escapeHtml(profile.payment.accountName)}
BSB: ${escapeHtml(profile.payment.bsb)}
Account: ${escapeHtml(profile.payment.accountNumber)}
PayID: ${escapeHtml(profile.payment.payId)}
Reference: ${escapeHtml(invoice.paymentReference)}
Terms: ${invoice.termsDays} days</div>
      </div>`
      }
      <div class=\"totals\">
        <div class=\"total-row\"><span>Subtotal</span><strong>${formatCurrency(invoice.subtotal, invoice.currency)}</strong></div>
        <div class=\"total-row\"><span>GST</span><strong>${formatCurrency(invoice.gstTotal, invoice.currency)}</strong></div>
        <div class=\"total-row\"><span>${totalLabel}</span><strong>${formatCurrency(invoice.total, invoice.currency)}</strong></div>
      </div>
    </section>

    ${invoice.notes ? `<section class=\"card\" style=\"margin-top:12px\"><h3>Notes</h3><div class=\"body\">${escapeHtml(invoice.notes)}</div></section>` : ""}

    <section class=\"footer\">${escapeHtml(
      isQuote
        ? "This quote is valid until the date shown above and is not a tax invoice. Final invoice will be issued on acceptance."
        : profile.notesFooter ?? "Thank you for supporting independent photography. Please quote the invoice number in your payment reference."
    )}</section>
  </div>
</body>
</html>`;
}
