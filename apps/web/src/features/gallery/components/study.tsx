import type { Carpet } from "@farsh/contracts";

import { KnotSpecTable, materialSpecs } from "@/features/research";

import { Loupe } from "./loupe";

const notes = [
  {
    term: "رج",
    text: "در فرش دستباف، تعداد گره‌هایی که در هفت سانتی‌متر از عرض فرش جا شده‌اند. چهل رج یعنی حدود سیصد هزار گره در هر متر مربع؛ هفتاد رج، نزدیک یک میلیون.",
  },
  {
    term: "شانه و تراکم",
    text: "در فرش ماشینی، شانه تعداد نقطه‌های پرز در یک متر عرض است و تراکم همان شمارش در یک متر طول. ۱۲۰۰ شانه با تراکم ۳۶۰۰ یعنی ۴٫۳ میلیون نقطه در متر مربع. این نقطه‌ها گره نیستند؛ نخ از لابه‌لای تار رد شده است.",
  },
  {
    term: "پشت فرش",
    text: "پشت دستباف کمی ناهموار است و هر گره را جدا نشان می‌دهد. پشت ماشینی شبکه‌ای کاملاً منظم است با پودهای سراسری. در تالار، گوشه‌ی فرش را بالا بیاورید تا ببینید.",
  },
];

export function Study({ carpet }: { carpet: Carpet }) {
  return (
    <section id="study" aria-labelledby="study-title" className="bg-card text-card-foreground">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-20 lg:py-28 [&>*]:min-w-0">
        <div className="lg:sticky lg:top-10 lg:self-start">
          <Loupe carpet={carpet} />
        </div>
        <div className="flex flex-col gap-12">
          <div className="flex flex-col gap-4">
            <h2 id="study-title" className="font-display text-display-l font-bold">
              گره‌ها را بشمارید
            </h2>
            <p className="max-w-[60ch] text-lead text-muted-foreground">
              ارزش فرش از فاصله دیده نمی‌شود. ذره‌بین را روی فرش بکشید: هرچه گره‌ها ریزتر، نقش
              دقیق‌تر و بافتش طولانی‌تر.
            </p>
          </div>
          <dl className="flex flex-col">
            {notes.map((n) => (
              <div
                key={n.term}
                className="grid gap-2 border-t border-border py-6 sm:grid-cols-[9rem_1fr] sm:gap-8"
              >
                <dt className="font-display text-heading font-bold text-primary">{n.term}</dt>
                <dd className="max-w-[60ch] text-body">{n.text}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-col gap-4">
            <h3 className="font-display text-heading font-bold">سه جنس در یک جدول</h3>
            <KnotSpecTable specs={materialSpecs} />
          </div>
        </div>
      </div>
    </section>
  );
}
