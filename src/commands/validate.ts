import { loadProfile } from "../profile";
import { loadInvoiceInput } from "../normalize";
import { validateInvoice, validateProfile } from "../validation";
import { DocumentType, InvoiceInput } from "../types";

export interface ValidateOptions {
  input: string;
  profile: string;
  type?: DocumentType;
}

export function runValidate(options: ValidateOptions): number {
  const profile = loadProfile(options.profile);
  const profileValidation = validateProfile(profile);
  const loaded = loadInvoiceInput(options.input);
  const typedInput: InvoiceInput =
    options.type && loaded.input.documentType !== options.type
      ? { ...loaded.input, documentType: options.type }
      : loaded.input;
  const invoiceValidation = validateInvoice(profile, typedInput);

  const report = {
    profile: profileValidation,
    invoice: invoiceValidation,
  };

  process.stdout.write(JSON.stringify(report, null, 2) + "\n");

  return profileValidation.valid && invoiceValidation.valid ? 0 : 1;
}
