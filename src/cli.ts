#!/usr/bin/env node
import { Command } from "commander";
import { runGenerate } from "./commands/generate";
import { runValidate } from "./commands/validate";
import { runPreview } from "./commands/preview";

const program = new Command();

program
  .name("invoice-flow")
  .description("Invoice Flow: agent-friendly AU invoice and quote generator")
  .version("1.0.0");

program
  .command("generate")
  .description("Generate PDF + normalized JSON + validation report")
  .requiredOption("--input <path-or-text>", "JSON file path or raw text")
  .requiredOption("--profile <path>", "Business profile JSON path")
  .option("--type <invoice|quote>", "Document type", "invoice")
  .option("--out <dir>", "Output directory", "./output")
  .action(async (opts: { input: string; profile: string; out: string; type: "invoice" | "quote" }) => {
    try {
      await runGenerate(opts);
    } catch (error) {
      process.stderr.write(`${String(error)}\n`);
      process.exitCode = 1;
    }
  });

program
  .command("validate")
  .description("Validate invoice input and profile, then print JSON report")
  .requiredOption("--input <path-or-text>", "JSON file path or raw text")
  .requiredOption("--profile <path>", "Business profile JSON path")
  .option("--type <invoice|quote>", "Document type", "invoice")
  .action((opts: { input: string; profile: string; type: "invoice" | "quote" }) => {
    try {
      process.exitCode = runValidate(opts);
    } catch (error) {
      process.stderr.write(`${String(error)}\n`);
      process.exitCode = 1;
    }
  });

program
  .command("preview")
  .description("Render invoice HTML preview without generating PDF")
  .requiredOption("--input <path-or-text>", "JSON file path or raw text")
  .requiredOption("--profile <path>", "Business profile JSON path")
  .option("--type <invoice|quote>", "Document type", "invoice")
  .option("--out <dir>", "Output directory", "./output")
  .option("--html", "Print HTML to stdout", false)
  .action((opts: { input: string; profile: string; out: string; html: boolean; type: "invoice" | "quote" }) => {
    try {
      runPreview(opts);
    } catch (error) {
      process.stderr.write(`${String(error)}\n`);
      process.exitCode = 1;
    }
  });

program
  .command("quote")
  .description("Generate a visually distinct quote PDF + JSON artifacts")
  .requiredOption("--input <path-or-text>", "JSON file path or raw text")
  .requiredOption("--profile <path>", "Business profile JSON path")
  .option("--out <dir>", "Output directory", "./output")
  .action(async (opts: { input: string; profile: string; out: string }) => {
    try {
      await runGenerate({ ...opts, type: "quote" });
    } catch (error) {
      process.stderr.write(`${String(error)}\n`);
      process.exitCode = 1;
    }
  });

program.parse(process.argv);
