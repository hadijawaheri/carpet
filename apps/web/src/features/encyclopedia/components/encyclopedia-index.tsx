import Link from "next/link";

import { formatNumber } from "@/lib/format";
import { paths } from "@/lib/paths";

import { articles, topicLabels } from "../data/articles";
import { DraftNotice } from "./draft-notice";

export function EncyclopediaIndex() {
  return (
    <main className="mx-auto max-w-7xl px-6 pt-32 pb-12">
      <p className="eyebrow text-gold-text">دانشنامه‌ی فرش</p>
      <h1 className="mt-3 text-5xl">گره به گره، از نزدیک</h1>
      <p className="mt-6 max-w-2xl leading-relaxed text-muted-foreground">
        نوشته‌هایی کوتاه درباره‌ی گره، تراکم، جنس و قیمت فرش ایرانی؛ برای اینکه پیش از دیدن یک فرش
        بدانید به چه چیزی نگاه کنید.
      </p>
      <DraftNotice className="mt-6 max-w-2xl" />
      <Link
        href={paths.knotCalculator}
        className="mt-10 flex max-w-2xl flex-col gap-1 bg-alabaster p-6 transition hover:shadow-lift focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <span className="eyebrow text-gold-text">ابزار</span>
        <span className="text-2xl">ماشین‌حساب رج و تراکم گره</span>
        <span className="text-sm text-muted-foreground">
          از رج یا شانه، شمار گره در متر مربع و در کل فرش را حساب کنید.
        </span>
      </Link>
      <ul className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <li key={article.slug}>
            <Link
              href={paths.article(article.slug)}
              className="group flex h-full flex-col border bg-card p-6 transition duration-500 hover:-translate-y-1 hover:shadow-lift focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <p className="eyebrow text-gold-text">
                {topicLabels[article.topic]} · {formatNumber(article.readingMinutes)} دقیقه
              </p>
              <h2 className="mt-3 text-2xl group-hover:underline group-hover:underline-offset-6">
                {article.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {article.excerpt}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
