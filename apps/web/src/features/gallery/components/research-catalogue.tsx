import type { ArticleTopic } from "@farsh/contracts";

import { articleSummaries } from "@/features/research";
import { formatNumber } from "@/lib/format";

const topicLabels: Record<ArticleTopic, string> = {
  density: "تراکم",
  material: "جنس",
  price: "قیمت",
  craft: "بافت",
};

/** The reading room: articles listed like a museum catalogue, one entry per line. */
export function ResearchCatalogue() {
  return (
    <section
      id="research"
      aria-labelledby="research-title"
      className="bg-card text-card-foreground"
    >
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-20 lg:py-28 [&>*]:min-w-0">
        <div className="flex flex-col gap-4">
          <h2 id="research-title" className="font-display text-display-l font-bold">
            پژوهش
          </h2>
          <p className="max-w-[40ch] text-lead text-muted-foreground">
            چرا یک فرش ابریشم چند برابر فرش ماشینی هم‌اندازه‌اش قیمت دارد؟ نوشته‌ها در حال تکمیل‌اند
            و هر عدد پیش از انتشار منبع می‌گیرد.
          </p>
        </div>
        <ol className="flex flex-col">
          {articleSummaries.map((a) => (
            <li
              key={a.slug}
              className="grid gap-x-8 gap-y-2 border-t border-card-foreground py-7 sm:grid-cols-[1fr_auto]"
            >
              <div className="flex flex-col gap-2">
                <h3 className="font-display text-heading font-bold">{a.title}</h3>
                <p className="max-w-[58ch] text-body text-muted-foreground">{a.excerpt}</p>
              </div>
              <p className="flex gap-4 text-label text-muted-foreground sm:flex-col sm:gap-1 sm:text-end">
                <span>{topicLabels[a.topic]}</span>
                <span>{formatNumber(a.readingMinutes)} دقیقه</span>
                {a.isDraft ? <span className="font-semibold text-primary">پیش‌نویس</span> : null}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
