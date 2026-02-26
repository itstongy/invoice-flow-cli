export type ErrorSeverity = "error" | "warning";
export type DocumentType = "invoice" | "quote";

export interface ValidationMessage {
  code: string;
  message: string;
  severity: ErrorSeverity;
  path?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
  compliance_flags: string[];
}

export interface PaymentDetails {
  bankName: string;
  accountName: string;
  bsb: string;
  accountNumber: string;
  payId: string;
  paymentReferenceLabel?: string;
}

export interface BusinessProfile {
  businessName?: string;
  legalName: string;
  abn?: string;
  email: string;
  phone: string;
  website?: string;
  address: string;
  logoPath?: string;
  currency?: string;
  defaultTermsDays: number;
  payment: PaymentDetails;
  notesFooter?: string;
  sequenceStatePath?: string;
}

export interface InvoiceClient {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  abn?: string;
}

export interface InvoiceSession {
  type?: string;
  shootDate?: string;
  location?: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxable?: boolean;
}

export interface InvoiceInput {
  documentType?: DocumentType;
  invoiceNumber?: string;
  issueDate: string;
  dueDate: string;
  validUntil?: string;
  currency?: string;
  gstEnabled?: boolean;
  session?: InvoiceSession;
  client: InvoiceClient;
  lineItems: InvoiceLineItem[];
  notes?: string;
  payment?: {
    termsDays?: number;
    reference?: string;
  };
}

export interface NormalizedLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxable: boolean;
  lineTotal: number;
  gstAmount: number;
}

export interface InvoiceNormalized {
  schemaVersion: "invoice-normalized-v1";
  documentType: DocumentType;
  invoiceLabel: "Invoice" | "Tax Invoice" | "Quote";
  dateLabel: "Due Date" | "Valid Until";
  dateValue: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  validUntil?: string;
  currency: string;
  gstEnabled: boolean;
  client: InvoiceClient;
  session?: InvoiceSession;
  lineItems: NormalizedLineItem[];
  subtotal: number;
  gstTotal: number;
  total: number;
  paymentReference: string;
  termsDays: number;
  notes?: string;
}

export interface LoadedInput {
  input: InvoiceInput;
  raw: string;
  source: "json" | "text";
}
