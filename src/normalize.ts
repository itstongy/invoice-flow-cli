import { InvoiceInput, LoadedInput } from "./types";
import { readFileOrLiteral } from "./utils";

function parseBoolean(value: string): boolean | undefined {
  const lowered = value.trim().toLowerCase();
  if (["true", "yes", "y", "on"].includes(lowered)) return true;
  if (["false", "no", "n", "off"].includes(lowered)) return false;
  return undefined;
}

function parseTextInvoice(raw: string): InvoiceInput {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const lineItems: InvoiceInput["lineItems"] = [];
  const fields = new Map<string, string>();

  for (const line of lines) {
    if (line.startsWith("-") && line.includes("|")) {
      const parts = line
        .slice(1)
        .split("|")
        .map((p) => p.trim());
      if (parts.length >= 3) {
        const [description, qty, unit, taxable] = parts;
        lineItems.push({
          description,
          quantity: Number(qty),
          unitPrice: Number(unit),
          taxable: taxable ? parseBoolean(taxable) ?? true : true,
        });
      }
      continue;
    }

    const idx = line.indexOf(":");
    if (idx > 0) {
      const key = line.slice(0, idx).trim().toLowerCase();
      const value = line.slice(idx + 1).trim();
      fields.set(key, value);
    }
  }

  if (lineItems.length === 0) {
    throw new Error(
      "Could not parse line items from text. Use JSON input or text lines like '- Description | 1 | 500 | true'."
    );
  }

  const issueDate = fields.get("issue date") ?? fields.get("issued") ?? new Date().toISOString().slice(0, 10);
  const dueDate = fields.get("due date") ?? issueDate;
  const validUntil = fields.get("valid until");
  const documentType = fields.get("type") === "quote" ? "quote" : "invoice";

  return {
    documentType,
    invoiceNumber: fields.get("invoice number"),
    issueDate,
    dueDate,
    validUntil,
    currency: fields.get("currency") ?? "AUD",
    gstEnabled: parseBoolean(fields.get("gst") ?? "false") ?? false,
    session: {
      type: fields.get("session type"),
      shootDate: fields.get("shoot date"),
      location: fields.get("location"),
    },
    client: {
      name: fields.get("client") ?? fields.get("client name") ?? "Client",
      email: fields.get("client email"),
      phone: fields.get("client phone"),
      address: fields.get("client address"),
      abn: fields.get("client abn"),
    },
    lineItems,
    notes: fields.get("notes"),
    payment: {
      reference: fields.get("payment reference"),
      termsDays: fields.has("terms days") ? Number(fields.get("terms days")) : undefined,
    },
  };
}

export function loadInvoiceInput(inputArg: string): LoadedInput {
  const { content } = readFileOrLiteral(inputArg);
  const trimmed = content.trim();

  try {
    const parsed = JSON.parse(trimmed) as InvoiceInput;
    return { input: parsed, raw: content, source: "json" };
  } catch {
    const parsed = parseTextInvoice(content);
    return { input: parsed, raw: content, source: "text" };
  }
}
