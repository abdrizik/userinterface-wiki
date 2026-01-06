#!/usr/bin/env tsx

/**
 * Pre-generates TTS audio for all documents during build.
 * Uses ElevenLabs with a single voice for cost efficiency.
 *
 * Usage:
 *   pnpm generate:tts           # Generate with confirmation
 *   pnpm generate:tts --dry-run # Preview only, no API calls
 *   pnpm generate:tts --force   # Skip confirmation prompt
 *
 * Cost optimization:
 * - Single voice: no multi-voice generation
 * - Flash v2.5 model: 50% cheaper
 * - Pre-generation only: no runtime costs
 * - Aggressive text preprocessing: fewer characters
 */

import { readdir } from "node:fs/promises";
import * as readline from "node:readline";
import { config } from "dotenv";
import pc from "picocolors";

config({ path: ".env.local", quiet: true });

import path from "node:path";
import {
  buildCacheKey,
  getPlainArticleText,
  getQuotaInfo,
  readFromCache,
  synthesizeSpeech,
  writeToCache,
} from "../lib/speech";

const CONTENT_DIR = path.join(process.cwd(), "content");

// ElevenLabs pricing (as of 2024)
const COST_PER_1K_CHARS = 0.15; // Flash v2.5 model pricing

interface DocumentInfo {
  slugSegments: string[];
  slug: string;
  characters: number;
  isCached: boolean;
  cacheKey: ReturnType<typeof buildCacheKey>;
  plainText: string;
}

interface GenerationResult {
  slug: string;
  status: "cached" | "generated" | "skipped" | "error";
  characters?: number;
  duration?: number;
  error?: unknown;
}

interface CLIOptions {
  dryRun: boolean;
  force: boolean;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes("--dry-run") || args.includes("-n"),
    force: args.includes("--force") || args.includes("-f"),
  };
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatChars(chars: number): string {
  if (chars >= 1000) return `${(chars / 1000).toFixed(1)}k`;
  return chars.toString();
}

function formatCost(chars: number): string {
  const cost = (chars / 1000) * COST_PER_1K_CHARS;
  if (cost < 0.01) return "<$0.01";
  return `$${cost.toFixed(2)}`;
}

async function getAllDocumentSlugs(): Promise<string[][]> {
  const entries = await readdir(CONTENT_DIR, { withFileTypes: true });

  const slugs: string[][] = [];

  for (const entry of entries) {
    // Handle directory-based content (content/slug-name/index.mdx)
    if (entry.isDirectory()) {
      slugs.push([entry.name]);
    }
    // Handle flat .mdx files (content/slug-name.mdx)
    else if (entry.isFile() && entry.name.endsWith(".mdx")) {
      const slug = entry.name.replace(/\.mdx$/, "");
      slugs.push([slug]);
    }
  }

  return slugs;
}

async function analyzeDocument(slugSegments: string[]): Promise<DocumentInfo> {
  const slug = slugSegments.join("/");
  const plainText = await getPlainArticleText(slugSegments);
  const characters = plainText.length;
  const cacheKey = buildCacheKey(slugSegments, plainText);
  const cached = await readFromCache(cacheKey);

  return {
    slugSegments,
    slug,
    characters,
    isCached: !!cached,
    cacheKey,
    plainText,
  };
}

async function generateTTSForDocument(
  doc: DocumentInfo,
): Promise<GenerationResult> {
  if (doc.isCached) {
    return { slug: doc.slug, status: "cached", characters: doc.characters };
  }

  try {
    process.stdout.write(pc.dim(`  generating ${doc.slug}...`));
    const startTime = performance.now();

    const synthesized = await synthesizeSpeech(doc.plainText);
    await writeToCache(doc.cacheKey, synthesized);

    const duration = performance.now() - startTime;

    process.stdout.write(
      `\r  ${pc.green("✓")} ${doc.slug} ${pc.dim(`${formatChars(doc.characters)} · ${formatDuration(duration)}`)}\n`,
    );

    return {
      slug: doc.slug,
      status: "generated",
      characters: doc.characters,
      duration,
    };
  } catch (error) {
    console.log();
    console.log(`  ${pc.red("✗")} ${doc.slug}`);
    console.log(
      pc.dim(`    ${error instanceof Error ? error.message : String(error)}`),
    );
    return { slug: doc.slug, status: "error", error };
  }
}

function printAnalysis(docs: DocumentInfo[], quotaRemaining: number) {
  const cached = docs.filter((d) => d.isCached);
  const toGenerate = docs.filter((d) => !d.isCached);
  const totalChars = toGenerate.reduce((sum, d) => sum + d.characters, 0);

  console.log();
  console.log(pc.bold("  Document Analysis"));
  console.log(pc.dim("  ─────────────────────────────────────"));

  // Show each document
  for (const doc of docs) {
    const status = doc.isCached ? pc.dim("cached") : pc.yellow("pending");
    const chars = formatChars(doc.characters);
    console.log(`  ${status} ${doc.slug} ${pc.dim(`(${chars} chars)`)}`);
  }

  console.log(pc.dim("  ─────────────────────────────────────"));

  // Summary
  console.log(`  ${pc.dim("Cached:")} ${cached.length} documents`);
  console.log(`  ${pc.dim("To generate:")} ${toGenerate.length} documents`);

  if (toGenerate.length > 0) {
    console.log(
      `  ${pc.dim("Characters:")} ${formatChars(totalChars)} (${formatCost(totalChars)})`,
    );
    console.log(
      `  ${pc.dim("Quota remaining:")} ${formatChars(quotaRemaining)}`,
    );

    if (totalChars > quotaRemaining) {
      console.log();
      console.log(
        pc.red(
          `  ⚠ Not enough quota! Need ${formatChars(totalChars)}, have ${formatChars(quotaRemaining)}`,
        ),
      );
    }
  }

  console.log();
}

function printSummary(
  results: GenerationResult[],
  totalTime: number,
  totalCharsGenerated: number,
) {
  const cached = results.filter((r) => r.status === "cached").length;
  const generated = results.filter((r) => r.status === "generated").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const errors = results.filter((r) => r.status === "error").length;

  console.log();

  // Status line
  const parts: string[] = [];
  if (cached > 0) parts.push(pc.dim(`${cached} cached`));
  if (generated > 0) parts.push(pc.green(`${generated} generated`));
  if (skipped > 0) parts.push(pc.yellow(`${skipped} skipped`));
  if (errors > 0) parts.push(pc.red(`${errors} failed`));
  console.log(`  ${parts.join(pc.dim(" · "))}`);

  if (totalCharsGenerated > 0) {
    console.log(
      pc.dim(
        `  ${formatChars(totalCharsGenerated)} characters used (${formatCost(totalCharsGenerated)})`,
      ),
    );
  }
  console.log(pc.dim(`  ${formatDuration(totalTime)}`));
  console.log();
}

async function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`  ${message} (y/N) `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
}

async function main() {
  const options = parseArgs();

  console.log();
  if (options.dryRun) {
    console.log(pc.cyan("  [DRY RUN] No API calls will be made\n"));
  }

  console.log(pc.dim("  TTS Generation with ElevenLabs"));
  console.log(pc.dim("  Model: Flash v2.5 | Voice: j9jfwdrw7BRfcR43Qohk\n"));

  // Check environment
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.log(pc.yellow("  ⚠ BLOB_READ_WRITE_TOKEN not set\n"));
    return;
  }

  if (!process.env.ELEVENLABS_API_KEY) {
    console.log(pc.yellow("  ⚠ ELEVENLABS_API_KEY not set\n"));
    return;
  }

  if (!process.env.ELEVENLABS_VOICE_ID) {
    console.log(pc.yellow("  ⚠ ELEVENLABS_VOICE_ID not set\n"));
    return;
  }

  // Get quota info
  let quotaRemaining = 0;
  try {
    const quota = await getQuotaInfo();
    quotaRemaining = quota.remainingCharacters;
  } catch {
    console.log(pc.dim("  (Could not fetch quota info)"));
  }

  // Analyze all documents
  const slugs = await getAllDocumentSlugs();
  if (slugs.length === 0) {
    console.log(pc.yellow("  No documents found\n"));
    return;
  }

  console.log(pc.dim(`  Analyzing ${slugs.length} documents...\n`));

  const docs: DocumentInfo[] = [];
  for (const slugSegments of slugs) {
    try {
      const doc = await analyzeDocument(slugSegments);
      docs.push(doc);
    } catch (error) {
      console.log(
        pc.red(`  ✗ Error analyzing ${slugSegments.join("/")}: ${error}`),
      );
    }
  }

  // Print analysis
  printAnalysis(docs, quotaRemaining);

  const toGenerate = docs.filter((d) => !d.isCached);
  const totalChars = toGenerate.reduce((sum, d) => sum + d.characters, 0);

  // Dry run - exit here
  if (options.dryRun) {
    console.log(pc.cyan("  [DRY RUN] Exiting without generating\n"));
    return;
  }

  // Nothing to generate
  if (toGenerate.length === 0) {
    console.log(pc.green("  ✓ All documents already cached\n"));
    return;
  }

  // Check quota
  if (totalChars > quotaRemaining) {
    console.log(pc.red("  Aborting: insufficient quota\n"));
    process.exit(1);
  }

  // Confirm generation
  if (!options.force) {
    const shouldProceed = await confirm(
      `Generate ${toGenerate.length} documents using ${formatChars(totalChars)} characters (${formatCost(totalChars)})?`,
    );
    if (!shouldProceed) {
      console.log(pc.yellow("\n  Cancelled\n"));
      return;
    }
    console.log();
  }

  // Generate
  const startTime = performance.now();
  const results: GenerationResult[] = [];
  let totalCharsGenerated = 0;

  for (const doc of docs) {
    const result = await generateTTSForDocument(doc);
    results.push(result);

    if (result.status === "generated" && result.characters) {
      totalCharsGenerated += result.characters;
    }

    // Small delay between API calls to be nice to the API
    if (result.status === "generated") {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  const totalTime = performance.now() - startTime;

  printSummary(results, totalTime, totalCharsGenerated);

  // Show remaining quota after generation
  if (totalCharsGenerated > 0) {
    try {
      const quota = await getQuotaInfo();
      console.log(
        pc.dim(
          `  Remaining quota: ${formatChars(quota.remainingCharacters)} characters\n`,
        ),
      );
    } catch {
      // Ignore
    }
  }

  const errors = results.filter((r) => r.status === "error");
  if (errors.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(pc.red("  Error:"), error);
  process.exit(1);
});
