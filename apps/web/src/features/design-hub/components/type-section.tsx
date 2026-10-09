import { HubSection } from "./hub-section";

const specimens = [
  {
    token: "inscription",
    size: "52–96 / 1.02",
    className: "font-display text-inscription font-bold",
    sample: "لطفاً دست بزنید.",
  },
  {
    token: "display-l",
    size: "40–64 / 1.08",
    className: "font-display text-display-l font-bold",
    sample: "مجموعه، به اندازه‌ی واقعی",
  },
  {
    token: "heading",
    size: "32 / 1.25",
    className: "font-display text-heading font-bold",
    sample: "۱۰۰۰ شانه یعنی چه؟",
  },
  {
    token: "lead",
    size: "20 / 1.9",
    className: "text-lead",
    sample:
      "فرش ابریشم سبک است و نور را مثل آب برمی‌گرداند؛ فرش ماشینی یکدست است و زود آرام می‌گیرد.",
  },
  {
    token: "body",
    size: "17 / 1.95",
    className: "text-body",
    sample:
      "در فرش دستباف تراکم را با رج می‌سنجند: تعداد گره‌هایی که در هفت سانتی‌متر از عرض فرش جا شده‌اند. هرچه رج بالاتر، نقش ریزتر و بافت آن طولانی‌تر.",
  },
  {
    token: "label",
    size: "13 / 1.6",
    className: "text-label font-semibold",
    sample: "ابعاد · جنس · تراکم",
  },
  {
    token: "accession",
    size: "12 / 1.4",
    className: "font-mono text-accession tracking-wider",
    sample: "FR–01 · 150 × 225 cm",
    latin: true,
  },
];

const families = [
  {
    name: "Markazi Text",
    role: "کتیبه‌ها و عنوان‌ها؛ نسخ ایرانی با کنتراست قلم",
    className: "font-display font-bold",
    sample: "فرش",
  },
  {
    name: "Vazirmatn",
    role: "متن و رابط؛ خوانا در اندازه‌های ریز",
    className: "font-sans",
    sample: "فرش",
  },
  {
    name: "Azeret Mono",
    role: "شماره‌ی اشیا و اندازه‌ها",
    className: "font-mono",
    sample: "FR–01",
  },
];

export function TypeSection() {
  return (
    <HubSection
      id="type"
      title="حروف"
      lead="کتیبه‌های تالار با نسخ ایرانی Markazi نوشته می‌شوند، مثل خط سردرها. متن با وزیرمتن و شماره‌ی اشیا با یک تک‌فاصله، مثل برچسب موزه."
    >
      <ul className="grid gap-4 sm:grid-cols-3">
        {families.map((f) => (
          <li
            key={f.name}
            className="flex flex-col gap-2 bg-card p-5 text-card-foreground shadow-mount"
          >
            <span className={`${f.className} text-5xl leading-tight`}>{f.sample}</span>
            <span dir="ltr" className="self-end font-mono text-accession">
              {f.name}
            </span>
            <span className="text-label text-muted-foreground">{f.role}</span>
          </li>
        ))}
      </ul>
      <dl className="mt-12 flex flex-col">
        {specimens.map((s) => (
          <div
            key={s.token}
            className="grid items-baseline gap-2 border-b border-on-wall-muted/25 py-6 sm:grid-cols-[10rem_1fr] sm:gap-10"
          >
            <dt className="flex gap-3 font-mono text-accession text-on-wall-muted sm:flex-col sm:items-start sm:gap-1">
              <span dir="ltr" className="text-foreground">
                text-{s.token}
              </span>
              <span dir="ltr">{s.size}</span>
            </dt>
            <dd className={`${s.className} max-w-3xl`} dir={"latin" in s ? "ltr" : undefined}>
              {s.sample}
            </dd>
          </div>
        ))}
      </dl>
    </HubSection>
  );
}
