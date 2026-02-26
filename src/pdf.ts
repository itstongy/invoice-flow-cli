import { chromium } from "playwright";

export interface PdfRenderOptions {
  scale?: number;
}

export async function htmlToPdf(html: string, outputPath: string, options?: PdfRenderOptions): Promise<void> {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.pdf({
    path: outputPath,
    format: "A4",
    preferCSSPageSize: true,
    printBackground: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
    scale: options?.scale ?? 1,
  });
  await browser.close();
}
