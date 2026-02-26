import path from "node:path";
import { processInvoiceInput } from "../pipeline";
import { ensureDir, writeJsonFile } from "../utils";
import { renderInvoiceHtml } from "../render";
import { htmlToPdf } from "../pdf";
import { DocumentType } from "../types";

export interface GenerateOptions {
  input: string;
  profile: string;
  out: string;
  type?: DocumentType;
}

export async function runGenerate(options: GenerateOptions): Promise<void> {
  const documentType: DocumentType = options.type ?? "invoice";
  const { profile, normalized, validation } = processInvoiceInput(options.input, options.profile, documentType);
  ensureDir(options.out);

  const baseName = documentType === "quote" ? "quote" : "invoice";
  const normalizedPath = path.resolve(options.out, `${baseName}.normalized.json`);
  const validationPath = path.resolve(options.out, `${baseName}.validation.json`);
  const pdfPath = path.resolve(options.out, `${baseName}.pdf`);

  const html = renderInvoiceHtml(profile, normalized);

  const pdfScale = documentType === "quote" ? 1.26 : 1;
  await htmlToPdf(html, pdfPath, { scale: pdfScale });
  writeJsonFile(normalizedPath, normalized);
  writeJsonFile(validationPath, validation);

  process.stdout.write(`Generated:\n- ${pdfPath}\n- ${normalizedPath}\n- ${validationPath}\n`);
}
