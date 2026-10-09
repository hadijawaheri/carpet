import { HubSection } from "./hub-section";

const specimens = [
  { token: "display-xl", size: "88 / 1.05", font: "font-display font-bold", sample: "تار و پود" },
  {
    token: "display-l",
    size: "56 / 1.1",
    font: "font-display font-bold",
    sample: "هر گره، یک تصمیم",
  },
  {
    token: "heading",
    size: "30 / 1.3",
    font: "font-display font-semibold",
    sample: "۱۰۰۰ شانه یعنی چه؟",
  },
  {
    token: "latin-accent",
    size: "40 / 1.1",
    font: "font-latin italic text-brand-text",
    sample: "Hand-knotted in Kashan",
    latin: true,
  },
  {
    token: "lead",
    size: "20 / 1.9",
    font: "",
    sample:
      "فرش ابریشم سبک است و نور را مثل آب برمی‌گرداند؛ فرش ماشینی یکدست است و زود آرام می‌گیرد.",
  },
  {
    token: "body",
    size: "17 / 1.95",
    font: "",
    sample:
      "در فرش دستباف تراکم را با رج می‌سنجند: تعداد گره‌هایی که در هفت سانتی‌متر از عرض فرش جا شده‌اند. هرچه رج بالاتر، نقش ریزتر و بافت آن طولانی‌تر.",
  },
  { token: "label", size: "13 / 1.6", font: "font-semibold", sample: "ابعاد · جنس · تراکم" },
  {
    token: "spec",
    size: "14 / 1.5",
    font: "font-mono",
    sample: "1200 shaneh · 3600 takham",
    latin: true,
  },
] as const;

const textClass: Record<(typeof specimens)[number]["token"], string> = {
  "display-xl": "text-display-l sm:text-display-xl",
  "display-l": "text-heading sm:text-display-l",
  heading: "text-heading",
  "latin-accent": "text-latin-accent",
  lead: "text-lead",
  body: "text-body",
  label: "text-label",
  spec: "text-spec",
};

const families = [
  {
    name: "Reem Kufi",
    role: "عنوان‌ها؛ کوفیِ هندسی، هم‌خانواده‌ی کتیبه‌ی حاشیه‌ی فرش",
    className: "font-display",
  },
  { name: "Vazirmatn", role: "متن؛ خوانا در اندازه‌های ریز و بلند", className: "font-sans" },
  {
    name: "Fraunces Italic",
    role: "چاشنی لاتین؛ نام شهرها و شماره‌ها",
    className: "font-latin italic",
  },
  { name: "JetBrains Mono", role: "مشخصات فنی و توکن‌ها", className: "font-mono" },
];

export function TypeSection() {
  return (
    <HubSection
      id="type"
      index="02"
      latin="Typography"
      title="حروف"
      lead="فارسی ارتفاع خط بیشتری از لاتین می‌خواهد؛ برای همین فاصله‌ی سطرِ متن نزدیک به دو است. لاتین فقط چاشنی است، نه زبان دوم."
    >
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {families.map((f) => (
          <li key={f.name} className="flex flex-col gap-2 rounded-lg bg-card p-5">
            <span
              className={`${f.className} text-4xl`}
              dir={f.className.includes("display") ? "rtl" : "ltr"}
            >
              {f.className.includes("display") || f.className === "font-sans" ? "فرش" : "Aa"}
            </span>
            <span className="font-mono text-xs text-foreground" dir="ltr">
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
            className="grid items-baseline gap-2 border-b border-border py-6 sm:grid-cols-[10rem_1fr] sm:gap-10"
          >
            <dt className="flex gap-3 font-mono text-xs text-muted-foreground sm:flex-col sm:items-start sm:gap-1">
              <span dir="ltr" className="text-foreground">
                text-{s.token}
              </span>
              <span dir="ltr">{s.size}</span>
            </dt>
            <dd
              className={`${textClass[s.token]} ${s.font} max-w-3xl`}
              dir={"latin" in s ? "ltr" : undefined}
            >
              {s.sample}
            </dd>
          </div>
        ))}
      </dl>
    </HubSection>
  );
}
