import fs from "node:fs";
import path from "node:path";

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatCurrency(amount: number, currency = "AUD"): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function isLikelyPath(input: string): boolean {
  if (!input.trim()) return false;
  if (input.includes("\n")) return false;
  if (input.trim().startsWith("{")) return false;
  return fs.existsSync(path.resolve(process.cwd(), input));
}

export function readFileOrLiteral(inputArg: string): { content: string; sourcePath?: string } {
  if (isLikelyPath(inputArg)) {
    const sourcePath = path.resolve(process.cwd(), inputArg);
    return { content: fs.readFileSync(sourcePath, "utf8"), sourcePath };
  }
  return { content: inputArg };
}

export function ensureDir(targetDir: string): void {
  fs.mkdirSync(targetDir, { recursive: true });
}

export function writeJsonFile(targetPath: string, payload: unknown): void {
  fs.writeFileSync(targetPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
}

export function sanitizeABN(value?: string): string | undefined {
  if (!value) return undefined;
  const digits = value.replace(/\D/g, "");
  return digits || undefined;
}

export function isValidABN(value?: string): boolean {
  const digits = sanitizeABN(value);
  if (!digits || digits.length !== 11) return false;
  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  const numbers = digits.split("").map((d) => Number(d));
  numbers[0] -= 1;
  const checksum = numbers.reduce((sum, n, i) => sum + n * weights[i], 0);
  return checksum % 89 === 0;
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
