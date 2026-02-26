import fs from "node:fs";
import path from "node:path";
import { processInvoiceInput } from "../pipeline";
import { ensureDir } from "../utils";
import { renderInvoiceHtml } from "../render";
import { DocumentType } from "../types";

export interface PreviewOptions {
  input: string;
  profile: string;
  out: string;
  html: boolean;
  type?: DocumentType;
}

export function runPreview(options: PreviewOptions): void {
  const documentType: DocumentType = options.type ?? "invoice";
  const { profile, normalized } = processInvoiceInput(options.input, options.profile, documentType);
  ensureDir(options.out);
  const htmlContent = renderInvoiceHtml(profile, normalized);
  const baseName = documentType === "quote" ? "quote" : "invoice";
  const previewPath = path.resolve(options.out, `${baseName}.preview.html`);
  fs.writeFileSync(previewPath, htmlContent, "utf8");

  if (options.html) {
    process.stdout.write(htmlContent + "\n");
  } else {
    process.stdout.write(`Preview HTML written to ${previewPath}\n`);
  }
}
