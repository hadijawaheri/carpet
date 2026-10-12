import type { Carpet } from "@farsh/contracts";

import { Loupe } from "./loupe";

// The units are named but not defined: neither has a sourced length or count yet, so none is invented.
const notes = [
  {
    term: "رج",
    text: "یکی از دو واحد تراکم گره. طول و شمارش آن هنوز منبع ندارد؛ تعریف کامل پس از تأیید می‌آید.",
  },
  {
    term: "شانه",
    text: "واحد دوم تراکم گره. تفاوتش با رج هنوز منبع ندارد؛ تعریف کامل پس از تأیید می‌آید.",
  },
  {
    term: "پشت فرش",
    text: "عکس پشت این فرش‌ها هنوز اضافه نشده است.",
  },
];

export function Study({ carpet }: { carpet: Carpet }) {
  return (
    <section id="study" aria-labelledby="study-title" className="bg-background">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-20 lg:py-28 [&>*]:min-w-0">
        <div className="flex flex-col gap-12">
          <div className="flex flex-col gap-4">
            <h2 id="study-title" className="font-display text-display-l font-bold">
              گره‌ها را بشمارید
            </h2>
            <p className="max-w-[60ch] text-lead text-on-wall-muted">
              ارزش فرش از فاصله دیده نمی‌شود. ذره‌بین را روی فرش بکشید و گره‌ها را از نزدیک ببینید.
            </p>
            <p className="max-w-[60ch] text-body text-on-wall-muted">
              در شبیه‌سازی، ابریشم برق بیشتری دارد و ماشینی سفت‌تر می‌افتد. قیمت به جنس و اندازه
              بستگی دارد؛ جزئیاتش در بخش پژوهش است و پیش‌نویس است.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <dl className="flex flex-col">
              {notes.map((n) => (
                <div
                  key={n.term}
                  className="grid gap-2 border-t border-on-wall-muted/30 py-6 sm:grid-cols-[9rem_1fr] sm:gap-8"
                >
                  <dt className="font-display text-heading font-bold text-saffron">{n.term}</dt>
                  <dd className="max-w-[60ch] text-body">{n.text}</dd>
                </div>
              ))}
            </dl>
            <p className="text-label text-on-wall-muted">
              تعریف‌ها و عددهای این بخش پیش‌نویس‌اند و پیش از انتشار منبع می‌گیرند.
            </p>
          </div>
        </div>
        <div className="lg:sticky lg:top-10 lg:self-start">
          <Loupe carpet={carpet} />
        </div>
      </div>
    </section>
  );
}
