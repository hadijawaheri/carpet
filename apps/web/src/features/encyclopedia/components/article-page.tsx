import type { Article } from "@farsh/contracts";
import Link from "next/link";

import { formatNumber } from "@/lib/format";
import { paths } from "@/lib/paths";

import { articles, topicLabels } from "../data/articles";
import { DraftNotice } from "./draft-notice";

export function ArticlePage({ article }: { article: Article }) {
  const others = articles.filter((a) => a.slug !== article.slug);

  return (
    <main className="mx-auto max-w-7xl px-6 pt-32 pb-12">
      <nav aria-label="مسیر صفحه" className="text-xs text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href={paths.home} className="hover:text-foreground">
              خانه
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href={paths.encyclopedia} className="hover:text-foreground">
              دانشنامه
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-foreground">
            {article.title}
          </li>
        </ol>
      </nav>

      <article className="mt-10 max-w-3xl">
        <p className="eyebrow text-gold-text">
          {topicLabels[article.topic]} · {formatNumber(article.readingMinutes)} دقیقه خواندن
        </p>
        <h1 className="mt-3 text-5xl leading-tight">{article.title}</h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{article.excerpt}</p>
        {article.isDraft ? <DraftNotice className="mt-6" /> : null}
        {article.sections.map((section) => (
          <section key={section.heading} className="mt-12">
            <h2 className="text-3xl">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mt-4 leading-loose">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
        {article.topic === "density" ? (
          <p className="mt-12 bg-alabaster p-6 text-sm">
            رج یا شانه‌ی یک فرش را دارید؟ با{" "}
            <Link
              href={paths.knotCalculator}
              className="text-madder underline-offset-6 hover:underline"
            >
              ماشین‌حساب رج و تراکم گره
            </Link>{" "}
            شمار گره‌هایش را حساب کنید.
          </p>
        ) : null}
      </article>

      {others.length > 0 ? (
        <section aria-labelledby="others-title" className="mt-24 border-t pt-12">
          <h2 id="others-title" className="text-3xl">
            نوشته‌های دیگر
          </h2>
          <ul className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {others.map((other) => (
              <li key={other.slug}>
                <Link
                  href={paths.article(other.slug)}
                  className="underline-offset-6 hover:underline"
                >
                  {other.title}
                </Link>
                <span className="text-xs text-muted-foreground"> · {topicLabels[other.topic]}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
