import Image from "next/image";

import { Monogram } from "@/components/shared/monogram";
import { NewsletterForm } from "@/features/newsletter";
import { formatPersianYear } from "@/lib/format";

const house = ["کارشناسان ما", "شناسنامه و اصالت", "رفوگری و نگهداری", "دیدار حضوری"];

export function SiteFooter() {
  return (
    <footer id="heritage" className="mt-32 scroll-mt-24 border-t bg-alabaster linen">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <Monogram />
            <span className="font-display text-3xl">فرش</span>
          </div>
          <h3 className="mt-8 text-4xl leading-snug">بیست‌وپنج قرن گره.</h3>
          <div className="mt-4 flex flex-col gap-6 sm:flex-row">
            <p className="max-w-md text-sm leading-loose text-muted-foreground">
              از فرش پازیریک تا کارگاه‌های درباری صفوی در اصفهان، بافندگان ایرانی پشم و ابریشم را به
              شعر گره زده‌اند. بافت یک فرش گاهی دو سال از عمر یک خانواده را می‌گیرد. ما آن سال‌ها را
              با نقش، جنس و تراکم هر فرش، شفاف و گره به گره، پیش چشم شما می‌گذاریم.
            </p>
            <Image
              src="/editorial/carpet-horse.jpg"
              alt="اسبی سیاه که فرشی سرخ بر پشتش افکنده شده، کنار فرش‌های آویخته بر دیوار"
              width={736}
              height={920}
              sizes="160px"
              className="w-40 shrink-0 self-start shadow-lift"
            />
          </div>
        </div>
        <div>
          <p className="eyebrow text-gold-text">خانه‌ی فرش</p>
          <ul className="mt-5 flex flex-col gap-3 text-sm text-muted-foreground">
            {house.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="eyebrow text-gold-text">خبرنامه</p>
          <p className="mt-5 text-sm text-muted-foreground">
            فرش‌های تازه را پیش از نمایش عمومی ببینید.
          </p>
          <NewsletterForm />
        </div>
      </div>
      <div className="border-t py-6 text-center text-xs text-muted-foreground">
        © {formatPersianYear(new Date())} فرش · بافته در ایران
      </div>
    </footer>
  );
}
