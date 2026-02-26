import fs from "node:fs";
import path from "node:path";
import { BusinessProfile } from "./types";

function applyEnv(value: string): string {
  return value.replace(/\$\{([A-Z0-9_]+)\}/g, (_, key: string) => process.env[key] ?? "");
}

function walkAndExpand(value: unknown): unknown {
  if (typeof value === "string") return applyEnv(value);
  if (Array.isArray(value)) return value.map(walkAndExpand);
  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      output[k] = walkAndExpand(v);
    }
    return output;
  }
  return value;
}

export function loadProfile(profilePath: string): BusinessProfile {
  const absolute = path.resolve(process.cwd(), profilePath);
  const raw = fs.readFileSync(absolute, "utf8");
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  return walkAndExpand(parsed) as BusinessProfile;
}
