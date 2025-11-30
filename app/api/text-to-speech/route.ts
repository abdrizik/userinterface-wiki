import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { PutBlobResult } from "@vercel/blob";
import { head, put } from "@vercel/blob";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import removeMarkdown from "remove-markdown";
import { normalizeWord } from "@/lib/text/normalize-word";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONTENT_DIR = path.join(process.cwd(), "markdown", "content");
const CACHE_PREFIX = "tts";
const VOICE_FALLBACK = "21m00Tcm4TlvDq8ikWAM";

class ArticleNotFoundError extends Error {}

class ResponseError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

interface WordTimestamp {
  word: string;
  start: number;
  end: number;
  normalized: string;
}

interface ElevenLabsWord {
  word?: string;
  start?: number;
  end?: number;
}

interface ElevenLabsCharacter {
  char?: string;
  character?: string;
  start?: number;
  end?: number;
}

interface ElevenLabsResponse {
  audio_base64?: string;
  alignment?: {
    words?: ElevenLabsWord[];
    characters?: ElevenLabsCharacter[];
  };
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => ({}));
    const slugSegments = toSlugSegments(payload.slug);

    if (!slugSegments.length) {
      return NextResponse.json(
        { error: "Missing article slug" },
        { status: 400 },
      );
    }

    const plainText = await loadArticle(slugSegments).catch((error) => {
      if (error instanceof ArticleNotFoundError) {
        throw new ResponseError("Article not found", 404);
      }
      throw error;
    });
    const contentHash = hashContent(plainText);
    const cacheBase = `${CACHE_PREFIX}/${slugSegments.join("__")}/${contentHash}`;

    const cached = await readFromCache(cacheBase);
    if (cached) {
      return NextResponse.json({ ...cached, hash: contentHash });
    }

    const synthesized = await synthesizeSpeech(plainText);

    const [audioUrl] = await Promise.all([
      uploadBinary(`${cacheBase}.mp3`, synthesized.audioBuffer, "audio/mpeg"),
      uploadJson(`${cacheBase}.json`, synthesized.timestamps),
    ]);

    return NextResponse.json({
      audioUrl,
      timestamps: synthesized.timestamps,
      hash: contentHash,
    });
  } catch (error) {
    if (error instanceof ResponseError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error("[tts]", error);
    return NextResponse.json(
      { error: "Unable to generate narration" },
      { status: 500 },
    );
  }
}

async function readFromCache(cacheBase: string) {
  const audioMeta = await safeHead(`${cacheBase}.mp3`);
  const jsonMeta = await safeHead(`${cacheBase}.json`);

  if (!audioMeta || !jsonMeta) return null;

  const timestamps = (await fetch(jsonMeta.url).then((res) =>
    res.json(),
  )) as WordTimestamp[];

  return {
    audioUrl: audioMeta.url,
    timestamps,
  };
}

async function synthesizeSpeech(text: string) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not set");
  }

  const voiceId = process.env.ELEVENLABS_VOICE_ID || VOICE_FALLBACK;

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        enable_logging: true,
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.8,
        },
      }),
    },
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      `ElevenLabs request failed: ${response.status} - ${message}`,
    );
  }

  const data = (await response.json()) as ElevenLabsResponse;

  if (!data.audio_base64) {
    throw new Error("ElevenLabs response missing audio data");
  }

  const audioBuffer = Buffer.from(data.audio_base64, "base64");
  const timestamps = buildWordTimestamps(data.alignment);

  return { audioBuffer, timestamps };
}

function buildWordTimestamps(
  alignment?: ElevenLabsResponse["alignment"],
): WordTimestamp[] {
  if (alignment?.words?.length) {
    return alignment.words
      .map((entry) => {
        const normalized = normalizeWord(entry.word ?? "");
        if (
          !entry.word ||
          typeof entry.start !== "number" ||
          typeof entry.end !== "number"
        ) {
          return null;
        }
        return {
          word: entry.word,
          start: entry.start,
          end: entry.end,
          normalized,
        } satisfies WordTimestamp;
      })
      .filter(Boolean) as WordTimestamp[];
  }

  if (alignment?.characters?.length) {
    const results: WordTimestamp[] = [];
    let buffer = "";
    let startTime: number | null = null;
    for (const charEntry of alignment.characters) {
      const character = charEntry.char ?? charEntry.character ?? "";
      const currentStart: number | null =
        typeof charEntry.start === "number" ? charEntry.start : startTime;
      const currentEnd: number | null =
        typeof charEntry.end === "number" ? charEntry.end : currentStart;

      if (character.trim()) {
        buffer += character;
        if (startTime === null && typeof currentStart === "number") {
          startTime = currentStart;
        }
      }

      if (!character.trim()) {
        if (buffer.trim() && startTime !== null) {
          const normalized = normalizeWord(buffer);
          if (normalized) {
            results.push({
              word: buffer,
              start: startTime,
              end: currentEnd ?? startTime,
              normalized,
            });
          }
        }
        buffer = "";
        startTime = null;
      }
    }

    if (buffer.trim() && startTime !== null) {
      const normalized = normalizeWord(buffer);
      if (normalized) {
        results.push({
          word: buffer,
          start: startTime,
          end: startTime,
          normalized,
        });
      }
    }

    return results;
  }

  return [];
}

async function loadArticle(slugSegments: string[]) {
  const articlePath = resolveArticlePath(slugSegments);
  const raw = await readFile(articlePath, "utf8").catch((error: unknown) => {
    if (isEnoent(error)) throw new ArticleNotFoundError();
    throw error;
  });
  const body = stripFrontmatter(raw);
  return removeMarkdown(body, { useImgAltText: false }).trim();
}

function isEnoent(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      (error as { code?: string }).code === "ENOENT",
  );
}

function stripFrontmatter(value: string) {
  if (!value.startsWith("---")) return value;
  const closingIndex = value.indexOf("\n---", 3);
  if (closingIndex === -1) return value;
  return value.slice(closingIndex + 4);
}

function resolveArticlePath(slugSegments: string[]) {
  const relativePath = `${path.join(...slugSegments)}.mdx`;
  const absolute = path.join(CONTENT_DIR, relativePath);
  if (!absolute.startsWith(CONTENT_DIR)) {
    throw new Error("Invalid slug path");
  }
  return absolute;
}

function hashContent(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

function toSlugSegments(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .flatMap((segment) => normalizeSegment(segment))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split("/")
      .flatMap((segment) => normalizeSegment(segment))
      .filter(Boolean);
  }

  return [];
}

function normalizeSegment(value: unknown) {
  if (typeof value !== "string") return [];
  const cleaned = value.trim();
  if (!cleaned) return [];
  if (!/^[-A-Za-z0-9]+$/.test(cleaned)) return [];
  return [cleaned];
}

async function safeHead(pathname: string) {
  try {
    return await head(pathname);
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

function isNotFound(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const status = (error as { status?: number }).status;
  if (status === 404) return true;
  const code = (error as { code?: string }).code;
  if (code === "item_not_found") return true;
  const message = (error as { message?: string }).message ?? "";
  return message.toLowerCase().includes("does not exist");
}

async function uploadBinary(
  pathname: string,
  data: Buffer,
  contentType: string,
) {
  const result = (await put(pathname, data, {
    access: "public",
    contentType,
  })) as PutBlobResult;

  return result.url;
}

async function uploadJson(pathname: string, payload: unknown) {
  const buffer = Buffer.from(JSON.stringify(payload));
  await put(pathname, buffer, {
    access: "public",
    contentType: "application/json",
  });
}
