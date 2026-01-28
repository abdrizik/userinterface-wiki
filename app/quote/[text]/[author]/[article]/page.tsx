import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SITE_MANIFEST } from "@/lib/site";

interface QuotePageProps {
  params: Promise<{
    text: string;
    author: string;
    article: string;
  }>;
  searchParams: Promise<{
    slug?: string;
  }>;
}

export async function generateMetadata({
  params,
}: QuotePageProps): Promise<Metadata> {
  const { text, author, article } = await params;

  const decodedText = Buffer.from(text, "base64url").toString("utf-8");
  const decodedAuthor = decodeURIComponent(author);
  const decodedArticle = Buffer.from(article, "base64url").toString("utf-8");

  const ogImageUrl = `${SITE_MANIFEST.url}/api/quote/og?text=${text}&author=${author}&article=${article}`;

  return {
    title: `"${decodedText.slice(0, 60)}${decodedText.length > 60 ? "…" : ""}" — ${decodedAuthor}`,
    description: `From "${decodedArticle}" on ${SITE_MANIFEST.name}`,
    openGraph: {
      title: `"${decodedText.slice(0, 60)}${decodedText.length > 60 ? "…" : ""}" — ${decodedAuthor}`,
      description: `From "${decodedArticle}" on ${SITE_MANIFEST.name}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `Quote by ${decodedAuthor}`,
        },
      ],
      type: "article",
      siteName: SITE_MANIFEST.name,
    },
    twitter: {
      card: "summary_large_image",
      title: `"${decodedText.slice(0, 60)}${decodedText.length > 60 ? "…" : ""}" — ${decodedAuthor}`,
      description: `From "${decodedArticle}" on ${SITE_MANIFEST.name}`,
      images: [ogImageUrl],
    },
  };
}

export default async function QuotePage({ searchParams }: QuotePageProps) {
  const { slug } = await searchParams;

  if (slug) {
    redirect(`/${slug}`);
  }

  redirect("/");
}
