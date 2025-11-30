import { Header } from "@markdown/components/header";
import { source } from "@markdown/lib/source";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import React from "react";
import { Article } from "@/components/layout";

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);

  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}

export default async function Page(props: {
  params: Promise<{ slug: string[] }>;
}) {
  const params = await props.params;

  const page = source.getPage(params.slug);

  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <React.Fragment>
      <Header page={page.data} />
      <Article>
        <MDX />
      </Article>
    </React.Fragment>
  );
}
