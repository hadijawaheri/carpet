import {
  type ArticleSummary,
  articleSummarySchema,
  type MaterialSpec,
  materialSpecSchema,
} from "@farsh/contracts";

// Common trade ranges as a starting point; each figure gets a source when the research articles are written.
const specs = [
  {
    material: "silk",
    low: { unit: "raj", value: 60 },
    high: { unit: "raj", value: 80 },
    feel: "سبک و روان، نور را مثل آب برمی‌گرداند",
  },
  {
    material: "wool",
    low: { unit: "raj", value: 30 },
    high: { unit: "raj", value: 50 },
    feel: "گرم و پرحجم، براقی نرم و مات",
  },
  {
    material: "machine",
    low: { unit: "shaneh", value: 700, takham: 2100 },
    high: { unit: "shaneh", value: 1500, takham: 4500 },
    feel: "یکدست و سفت‌تر، تاخوردگی‌اش زود آرام می‌گیرد",
  },
] satisfies MaterialSpec[];

const articles = [
  {
    slug: "what-is-shaneh",
    title: "۱۰۰۰ شانه یعنی چه؟",
    excerpt:
      "شانه و تراکم را از نزدیک می‌شماریم و نشان می‌دهیم چرا عدد بزرگ‌تر همیشه یعنی فرش بهتر نیست.",
    topic: "density",
    readingMinutes: 6,
  },
  {
    slug: "why-silk-costs-more",
    title: "چرا ابریشم گران‌تر است؟",
    excerpt: "از پیله تا پرز: نخ، رج، ساعت‌های بافت و اندازه، هر کدام چقدر روی قیمت اثر می‌گذارند.",
    topic: "price",
    readingMinutes: 9,
  },
  {
    slug: "reading-the-back",
    title: "پشت فرش را بخوانید",
    excerpt:
      "گره‌های دستباف کمی نامنظم‌اند و ماشینی‌ها مثل شطرنج. با یک نگاه به پشت فرش تفاوت را ببینید.",
    topic: "craft",
    readingMinutes: 5,
  },
] satisfies Omit<ArticleSummary, "isDraft">[];

export const materialSpecs: MaterialSpec[] = specs.map((s) => materialSpecSchema.parse(s));
export const articleSummaries: ArticleSummary[] = articles.map((a) =>
  articleSummarySchema.parse(a),
);
