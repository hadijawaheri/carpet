import { materialSpecs } from "../data/research";
import { KnotSpecTable } from "./knot-spec-table";

export function MaterialSpecs() {
  return (
    <section aria-labelledby="specs-title" className="bg-background">
      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-10 lg:pb-28">
        <div className="flex flex-col gap-4 bg-card p-6 text-card-foreground shadow-mount sm:p-8">
          <h2 id="specs-title" className="font-display text-heading font-bold">
            سه جنس در یک جدول
          </h2>
          <KnotSpecTable specs={materialSpecs} />
        </div>
      </div>
    </section>
  );
}
