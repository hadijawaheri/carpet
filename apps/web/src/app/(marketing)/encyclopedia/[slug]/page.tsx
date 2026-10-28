import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticlePage, articles, getArticle } from "@/features/encyclopedia";
import { paths } from "@/lib/paths";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

// Articles live in the code, so any other slug is unknown
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = getArticle((await params).slug);
  if (!article) notFound();
  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: paths.article(article.slug) },
    openGraph: { type: "article", title: article.title, description: article.excerpt },
  };
}

export default async function Page({ params }: Props) {
  const article = getArticle((await params).slug);
  if (!article) notFound();
  return <ArticlePage article={article} />;
}
