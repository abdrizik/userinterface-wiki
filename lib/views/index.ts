import { kv } from "@vercel/kv";

/**
 * Get view count for an article
 */
export async function getViews(slug: string): Promise<number> {
  return (await kv.get<number>(`views:${slug}`)) ?? 0;
}

/**
 * Get view counts for multiple articles
 */
export async function getMultipleViews(
  slugs: string[],
): Promise<Record<string, number>> {
  if (slugs.length === 0) return {};

  const keys = slugs.map((slug) => `views:${slug}`);
  const values = await kv.mget<number[]>(...keys);

  return slugs.reduce<Record<string, number>>((acc, slug, index) => {
    acc[slug] = values[index] ?? 0;
    return acc;
  }, {});
}

/**
 * Increment view count for an article
 */
export async function incrementViews(slug: string): Promise<number> {
  return await kv.incr(`views:${slug}`);
}

/**
 * Format view count for display
 */
export function formatViews(views: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "standard",
    compactDisplay: "short",
  }).format(views);
}
