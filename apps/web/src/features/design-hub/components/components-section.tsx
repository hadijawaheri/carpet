import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CarpetCard, carpets } from "@/features/catalog";
import { ArticleCard, articleSummaries, KnotSpecTable, materialSpecs } from "@/features/research";

import { HubSection } from "./hub-section";
import { MaterialToggleDemo } from "./material-toggle-demo";

function Specimen({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="font-mono text-xs text-muted-foreground">
        <span dir="ltr">{name}</span>
      </p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

export function ComponentsSection() {
  return (
    <HubSection
      id="components"
      index="04"
      latin="Components"
      title="اجزا"
      lead="پایه‌ها از shadcn می‌آیند و با توکن‌های فرش رنگ می‌گیرند. اجزای فرش (کارت، جدول تراکم، کارت مقاله) روی همان پایه‌ها ساخته شده‌اند."
    >
      <div className="grid gap-10 rounded-lg bg-card p-6 sm:p-10 md:grid-cols-2">
        <Specimen name="Button">
          <Button>افزودن به سبد</Button>
          <Button variant="secondary">مقایسه</Button>
          <Button variant="ghost">مطالعه‌ی مقاله</Button>
          <Button variant="destructive" size="sm">
            حذف
          </Button>
        </Specimen>
        <Specimen name="Badge">
          <Badge>دستباف</Badge>
          <Badge variant="outline">ابریشم</Badge>
          <Badge variant="muted">عکس موقت</Badge>
        </Specimen>
        <Specimen name="MaterialToggle">
          <MaterialToggleDemo />
        </Specimen>
        <Specimen name="Separator">
          <div className="flex w-full flex-col gap-3 text-label text-muted-foreground">
            <span>ابعاد</span>
            <Separator />
            <span>جنس</span>
          </div>
        </Specimen>
      </div>

      <h3 className="mt-16 mb-6 font-display text-heading font-semibold">کارت فرش</h3>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {carpets.map((c) => (
          <CarpetCard key={c.slug} carpet={c} />
        ))}
      </div>

      <h3 className="mt-16 mb-6 font-display text-heading font-semibold">جدول تراکم</h3>
      <KnotSpecTable specs={materialSpecs} />

      <h3 className="mt-16 mb-6 font-display text-heading font-semibold">کارت مقاله</h3>
      <div className="grid gap-10 md:grid-cols-3">
        {articleSummaries.map((a, i) => (
          <ArticleCard key={a.slug} article={a} index={i + 1} />
        ))}
      </div>
    </HubSection>
  );
}
