"use client";

import { materialLabels } from "@/features/carpet-viewer";

import { CarpetCard } from "./carpet-card";
import { MaterialPills } from "./material-pills";
import { type GalleryFilter, matchesSearch, useShowroom } from "./showroom-store";

export function Gallery() {
  const { carpets, search, setSearch, filter, setFilter, wishlist } = useShowroom();

  const options: { value: GalleryFilter; label: string }[] = [
    { value: "all", label: "همه" },
    { value: "silk", label: materialLabels.silk },
    { value: "wool", label: materialLabels.wool },
    { value: "machine", label: materialLabels.machine },
  ];
  if (wishlist.length > 0 || filter === "wishlist") {
    options.push({ value: "wishlist", label: "برگزیده‌ها" });
  }

  const list = carpets.filter((c) => {
    const inFilter =
      filter === "all" ||
      (filter === "wishlist" ? wishlist.includes(c.slug) : c.material === filter);
    return inFilter && matchesSearch(c, materialLabels[c.material], search);
  });

  return (
    <section id="collection" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-24">
      <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
        <div>
          <p className="eyebrow text-gold-text">گالری برگزیده</p>
          <h2 className="mt-3 text-4xl md:text-5xl">شاهکارها، به روایت جنس</h2>
        </div>
        <MaterialPills label="صافی جنس" value={filter} onChange={setFilter} options={options} />
      </div>
      <div className="mt-14 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {list.map((carpet, i) => (
          <CarpetCard key={`${carpet.slug}-${filter}`} carpet={carpet} index={i} />
        ))}
      </div>
      {list.length === 0 ? (
        <div className="mt-14 flex flex-col items-center gap-4 text-center text-muted-foreground">
          <p>فرشی با این جست‌وجو پیدا نشد.</p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setFilter("all");
            }}
            className="border-b border-foreground/40 text-sm text-foreground"
          >
            نمایش همه‌ی فرش‌ها
          </button>
        </div>
      ) : null}
    </section>
  );
}
