import path from "node:path";

export const CONTENT_DIR = path.join(process.cwd(), "content");
export const CACHE_PREFIX = "tts";

/**
 * TTS Provider: ElevenLabs
 *
 * Cost optimization:
 * - Single voice via ELEVENLABS_VOICE_ID env var
 * - Flash v2.5 model: 50% cheaper than Multilingual v2
 * - Pre-generation only: no on-demand API calls
 */
export const TTS_PROVIDER = "elevenlabs" as const;

/** Fallback voice ID if ELEVENLABS_VOICE_ID is not set */
export const STANDARD_VOICE_FALLBACK = "onwK4e9ZLuTAKqWW03F9";

/** Default ElevenLabs model */
export const DEFAULT_MODEL_ID = "eleven_flash_v2";
