import fs from "node:fs";
import path from "node:path";
import { DocumentType } from "./types";

interface SequenceState { [key: string]: number; }

function getStatePath(customPath?: string): string {
  if (customPath) return path.resolve(process.cwd(), customPath);
  return path.resolve(process.cwd(), ".state/invoice-sequence.json");
}

function loadState(statePath: string): SequenceState {
  if (!fs.existsSync(statePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(statePath, "utf8")) as SequenceState;
  } catch {
    return {};
  }
}

function saveState(statePath: string, state: SequenceState): void {
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2) + "\n", "utf8");
}

export function nextDocumentNumber(issueDate: string, documentType: DocumentType, customStatePath?: string): string {
  const yyyymm = issueDate.replace(/-/g, "").slice(0, 6);
  const key = `${documentType}-${yyyymm}`;
  const statePath = getStatePath(customStatePath);
  const state = loadState(statePath);
  const next = (state[key] ?? 0) + 1;
  state[key] = next;
  saveState(statePath, state);

  const prefix = documentType === "quote" ? "QTE" : "INV";
  return `${prefix}-${yyyymm}-${String(next).padStart(3, "0")}`;
}
