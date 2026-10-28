import Link from "next/link";

import { paths } from "@/lib/paths";

import { KnotCalculator } from "./knot-calculator";

export function KnotCalculatorPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 pt-32 pb-12">
      <nav aria-label="مسیر صفحه" className="text-xs text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href={paths.home} className="hover:text-foreground">
              خانه
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href={paths.encyclopedia} className="hover:text-foreground">
              دانشنامه
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-foreground">
            ماشین‌حساب گره
          </li>
        </ol>
      </nav>
      <p className="mt-10 eyebrow text-gold-text">ابزار</p>
      <h1 className="mt-3 text-5xl">ماشین‌حساب رج و تراکم گره</h1>
      <p className="mt-6 max-w-2xl leading-relaxed text-muted-foreground">
        رج یک فرش دستباف، یا شانه و تراکم یک فرش ماشینی را بنویسید تا ببینید در هر متر مربع و در کل
        فرش چند گره نشسته است. برای اینکه بدانید این واحدها چه می‌شمارند،{" "}
        <Link
          href={paths.article("raj-shaneh-density")}
          className="text-madder underline-offset-6 hover:underline"
        >
          نوشته‌ی رج، شانه و تراکم
        </Link>{" "}
        را بخوانید.
      </p>
      <div className="mt-12">
        <KnotCalculator />
      </div>
    </main>
  );
}
