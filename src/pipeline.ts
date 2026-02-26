import { BusinessProfile, DocumentType, InvoiceNormalized, ValidationResult } from "./types";
import { loadProfile } from "./profile";
import { loadInvoiceInput } from "./normalize";
import { normalizeInvoice, validateInvoice, validateProfile } from "./validation";

export interface ProcessedInvoice {
  profile: BusinessProfile;
  normalized: InvoiceNormalized;
  validation: ValidationResult;
}

export function processInvoiceInput(
  inputArg: string,
  profilePath: string,
  forcedDocumentType?: DocumentType
): ProcessedInvoice {
  const profile = loadProfile(profilePath);
  const profileValidation = validateProfile(profile);
  if (!profileValidation.valid) {
    const first = profileValidation.errors[0];
    throw new Error(`Invalid profile: ${first.code} ${first.message}`);
  }

  const loaded = loadInvoiceInput(inputArg);
  const typedInput = forcedDocumentType ? { ...loaded.input, documentType: forcedDocumentType } : loaded.input;
  const validation = validateInvoice(profile, typedInput);
  if (!validation.valid) {
    const first = validation.errors[0];
    throw new Error(`Invalid document input: ${first.code} ${first.message}`);
  }

  const normalized = normalizeInvoice(profile, typedInput, forcedDocumentType);
  return { profile, normalized, validation };
}
