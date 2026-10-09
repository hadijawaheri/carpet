import type { ArticleSummary, ArticleTopic } from "@farsh/contracts";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const topicLabels: Record<ArticleTopic, string> = {
  density: "تراکم",
  material: "جنس",
  price: "قیمت",
  craft: "بافت",
};

/** `href` stays optional until article pages exist, so the card never links to a 404. */
export function ArticleCard({
  article,
  index,
  href,
  className,
}: {
  article: ArticleSummary;
  index: number;
  href?: string;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "group relative flex flex-col gap-3 border-t-2 border-foreground pt-4 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-latin text-latin-accent text-brand-text" dir="ltr">
          {String(index).padStart(2, "0")}
        </span>
        <div className="flex gap-2">
          <Badge variant="outline">{topicLabels[article.topic]}</Badge>
          {article.isDraft ? <Badge variant="muted">پیش‌نویس</Badge> : null}
        </div>
      </div>
      <h3 className="font-display text-heading font-semibold">
        {href ? (
          <Link href={href} className="after:absolute after:inset-0 focus-visible:outline-none">
            {article.title}
          </Link>
        ) : (
          article.title
        )}
      </h3>
      <p className="text-body text-muted-foreground">{article.excerpt}</p>
      <p className="mt-auto flex items-center gap-2 text-label text-muted-foreground">
        {formatNumber(article.readingMinutes)} دقیقه مطالعه
        {href ? (
          <ArrowRight className="size-4 transition-transform duration-300 ease-settle group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
        ) : null}
      </p>
    </article>
  );
}
