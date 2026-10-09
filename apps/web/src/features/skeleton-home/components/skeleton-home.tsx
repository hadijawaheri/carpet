import { SiteHeader } from "@/components/layout/site-header";
import { CarpetPlayground } from "@/features/carpet-viewer";
import { carpets } from "@/features/catalog";

export function SkeletonHome() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-16 sm:px-10">
        <div className="flex max-w-2xl flex-col gap-3">
          <h1 className="font-display text-5xl leading-tight font-bold sm:text-6xl">
            اسکلت سایت <span className="text-brand-text">فرش</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Next.js، React Three Fiber و توکن‌های shadcn سر جایشان هستند. فرش را بگیرید و تکان دهید
            و جنس را عوض کنید تا شبیه‌سازی پارچه را ببینید. عکس‌ها موقت‌اند.
          </p>
        </div>
        <CarpetPlayground carpets={carpets} />
      </main>
    </>
  );
}
