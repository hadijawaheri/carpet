import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CarpetCard, carpets } from "@/features/catalog";
import { KnotSpecTable, materialSpecs } from "@/features/research";

import { HubSection } from "./hub-section";
import { LabelDemo } from "./label-demo";
import { MaterialToggleDemo } from "./material-toggle-demo";

function Specimen({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="font-mono text-accession text-muted-foreground">
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
      title="اجزا"
      lead="پایه‌ها از shadcn می‌آیند و رنگ تالار را می‌گیرند. برچسب موزه مهم‌ترین جزء است: هم معرفی شیء است و هم کنترل آن."
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_23rem] [&>*]:min-w-0">
        <div className="grid content-start gap-10 bg-card p-6 text-card-foreground shadow-mount sm:p-10 md:grid-cols-2">
          <Specimen name="Button · on mount">
            <Button>افزودن به فهرست</Button>
            <Button variant="secondary">مقایسه</Button>
            <Button variant="ghost">خواندن مقاله</Button>
          </Specimen>
          <Specimen name="Badge">
            <Badge>دستباف</Badge>
            <Badge variant="outline">ابریشم</Badge>
            <Badge variant="muted">عکس موقت</Badge>
          </Specimen>
          <Specimen name="MaterialToggle">
            <MaterialToggleDemo />
          </Specimen>
          <Specimen name="Button · on wall">
            <div className="flex flex-wrap gap-3 bg-background p-4 text-foreground">
              <Button variant="mount">ورود به تالار</Button>
              <Button variant="secondary">مجموعه</Button>
            </div>
          </Specimen>
        </div>
        <LabelDemo />
      </div>

      <h3 className="mt-16 mb-6 font-display text-heading font-bold">کارت فرش</h3>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {carpets.slice(0, 3).map((c) => (
          <CarpetCard key={c.slug} carpet={c} />
        ))}
      </div>

      <h3 className="mt-16 mb-6 font-display text-heading font-bold">جدول تراکم</h3>
      <div className="bg-card p-6 text-card-foreground shadow-mount sm:p-8">
        <KnotSpecTable specs={materialSpecs} />
      </div>
    </HubSection>
  );
}
