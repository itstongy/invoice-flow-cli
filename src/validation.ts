import fs from "node:fs";
import path from "node:path";
import Ajv2020, { ErrorObject } from "ajv/dist/2020";
import addFormats from "ajv-formats";
import {
  BusinessProfile,
  DocumentType,
  InvoiceInput,
  InvoiceNormalized,
  NormalizedLineItem,
  ValidationMessage,
  ValidationResult,
} from "./types";
import { isValidABN, roundMoney } from "./utils";
import { nextDocumentNumber } from "./numbering";

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

const invoiceSchema = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), "schemas/invoice.schema.v1.json"), "utf8")
);
const profileSchema = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), "schemas/profile.schema.v1.json"), "utf8")
);

const validateInvoiceSchema = ajv.compile(invoiceSchema);
const validateProfileSchema = ajv.compile(profileSchema);

function mapAjvErrors(errors: ErrorObject[] | null | undefined): ValidationMessage[] {
  if (!errors) return [];
  return errors.map((error) => ({
    code: `SCHEMA_${error.keyword.toUpperCase()}`,
    severity: "error",
    path: error.instancePath || "/",
    message: error.message ?? "Schema validation error",
  }));
}

function complianceChecks(profile: BusinessProfile, invoice: InvoiceInput): ValidationMessage[] {
  const checks: ValidationMessage[] = [];
  const documentType: DocumentType = invoice.documentType ?? "invoice";

  if (profile.abn && !isValidABN(profile.abn)) {
    checks.push({
      code: "INVALID_SELLER_ABN_FORMAT",
      severity: "warning",
      message: "Business profile ABN does not pass checksum validation.",
      path: "/abn",
    });
  }

  if (invoice.client.abn && !isValidABN(invoice.client.abn)) {
    checks.push({
      code: "INVALID_CLIENT_ABN_FORMAT",
      severity: "warning",
      message: "Client ABN does not pass checksum validation.",
      path: "/client/abn",
    });
  }

  if (documentType === "invoice" && invoice.gstEnabled) {
    if (!profile.abn) {
      checks.push({
        code: "MISSING_SELLER_ABN",
        severity: "error",
        message: "GST-enabled invoices should include seller ABN.",
        path: "/abn",
      });
    }

    const grossEstimate = invoice.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    if (grossEstimate >= 1000) {
      const hasRecipientIdentity = Boolean(invoice.client.name?.trim());
      const hasRecipientAddressOrABN = Boolean(invoice.client.address || invoice.client.abn);
      if (!hasRecipientIdentity || !hasRecipientAddressOrABN) {
        checks.push({
          code: "MISSING_BUYER_DETAILS_FOR_1000_PLUS",
          severity: "error",
          message:
            "GST-enabled tax invoices for totals >= AUD 1,000 must include recipient identity and address or ABN.",
          path: "/client",
        });
      }
    }
  }

  return checks;
}

export function validateProfile(profile: unknown): ValidationResult {
  const schemaValid = validateProfileSchema(profile);
  const errors = mapAjvErrors(validateProfileSchema.errors);
  const warnings: ValidationMessage[] = [];

  return {
    valid: Boolean(schemaValid) && errors.length === 0,
    errors,
    warnings,
    compliance_flags: [],
  };
}

export function validateInvoice(profile: BusinessProfile, invoice: unknown): ValidationResult {
  const schemaValid = validateInvoiceSchema(invoice);
  const errors = mapAjvErrors(validateInvoiceSchema.errors);
  const warnings: ValidationMessage[] = [];

  if (schemaValid) {
    const compliance = complianceChecks(profile, invoice as InvoiceInput);
    for (const msg of compliance) {
      if (msg.severity === "error") {
        errors.push(msg);
      } else {
        warnings.push(msg);
      }
    }
  }

  const typed = invoice as InvoiceInput;
  const documentType: DocumentType = typed.documentType ?? "invoice";
  const compliance_flags = [
    typed?.gstEnabled ? "GST_OPTION_ENABLED" : "GST_OPTION_DISABLED",
    documentType === "quote" ? "AU_QUOTE_RULES_V1" : "AU_INVOICE_RULES_V1",
  ];

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    compliance_flags,
  };
}

export function normalizeInvoice(
  profile: BusinessProfile,
  invoice: InvoiceInput,
  forcedDocumentType?: DocumentType
): InvoiceNormalized {
  const currency = invoice.currency ?? profile.currency ?? "AUD";
  const documentType: DocumentType = forcedDocumentType ?? invoice.documentType ?? "invoice";
  const gstEnabled = Boolean(invoice.gstEnabled);
  const invoiceNumber =
    invoice.invoiceNumber ?? nextDocumentNumber(invoice.issueDate, documentType, profile.sequenceStatePath);

  const lineItems: NormalizedLineItem[] = invoice.lineItems.map((item) => {
    const taxable = item.taxable ?? true;
    const lineTotal = roundMoney(item.quantity * item.unitPrice);
    const gstAmount = gstEnabled && taxable ? roundMoney(lineTotal / 11) : 0;

    return {
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxable,
      lineTotal,
      gstAmount,
    };
  });

  const subtotal = roundMoney(lineItems.reduce((sum, item) => sum + item.lineTotal, 0));
  const gstTotal = roundMoney(lineItems.reduce((sum, item) => sum + item.gstAmount, 0));

  return {
    schemaVersion: "invoice-normalized-v1",
    documentType,
    invoiceLabel: documentType === "quote" ? "Quote" : gstEnabled ? "Tax Invoice" : "Invoice",
    dateLabel: documentType === "quote" ? "Valid Until" : "Due Date",
    dateValue: documentType === "quote" ? invoice.validUntil ?? invoice.dueDate : invoice.dueDate,
    invoiceNumber,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    validUntil: invoice.validUntil,
    currency,
    gstEnabled,
    client: invoice.client,
    session: invoice.session,
    lineItems,
    subtotal,
    gstTotal,
    total: subtotal,
    paymentReference: invoice.payment?.reference ?? invoiceNumber,
    termsDays: invoice.payment?.termsDays ?? profile.defaultTermsDays,
    notes: invoice.notes,
  };
}
