import Image from "next/image";
import Link from "next/link";

import { paths } from "@/lib/paths";

export function Closing() {
  return (
    <footer className="relative isolate overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_40%_60%_at_30%_40%,var(--wall-lit),transparent_75%)]"
      />
      <div className="mx-auto grid max-w-7xl items-end gap-12 px-4 py-20 sm:px-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:py-28 [&>*]:min-w-0">
        <div className="flex flex-col gap-6">
          <p className="font-display text-inscription font-bold">
            فرش را باید <span className="text-saffron">لمس</span> کرد.
          </p>
          <p className="max-w-[46ch] text-lead text-on-wall-muted">
            این سایت یک نمونه‌کار طراحی است: عکس‌های واقعی فرش، پارچه‌ی سه‌بعدی، و هر جنس با وزن و
            برق خودش.
          </p>
          <nav aria-label="پایان" className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
            <Link
              href={paths.hall}
              className="inline-block py-1 underline decoration-saffron underline-offset-8 focus-visible:ring-2 focus-visible:ring-saffron focus-visible:outline-none"
            >
              بازگشت به تالار
            </Link>
            <Link
              href={paths.designHub}
              className="inline-block py-1 underline decoration-saffron underline-offset-8 focus-visible:ring-2 focus-visible:ring-saffron focus-visible:outline-none"
            >
              راهنمای طراحی
            </Link>
            <a
              href="https://github.com/hadijawaheri/carpet"
              className="inline-block py-1 underline decoration-saffron underline-offset-8 focus-visible:ring-2 focus-visible:ring-saffron focus-visible:outline-none"
            >
              کد روی گیت‌هاب
            </a>
          </nav>
        </div>
        <figure className="flex flex-col gap-3 justify-self-end">
          <div
            className="relative w-full max-w-sm overflow-hidden shadow-mount"
            style={{ aspectRatio: 0.8 }}
          >
            <Image
              src="/editorial/carpet-horse.jpg"
              alt="اسبی سیاه که فرشی سرخ رویش انداخته‌اند"
              fill
              sizes="384px"
              className="object-cover"
            />
          </div>
          <figcaption className="text-label text-on-wall-muted">
            عکس موقت، از مجموعه‌ی ارسالی صاحب سایت.
          </figcaption>
        </figure>
      </div>
      <p className="border-t border-on-wall-muted/30 px-4 py-6 text-label text-on-wall-muted sm:px-10">
        طراحی و ساخت: هادی · Next.js، React Three Fiber · همه‌ی فرش‌ها عکس واقعی‌اند، هیچ‌کدام کشیده
        نشده.
      </p>
    </footer>
  );
}
