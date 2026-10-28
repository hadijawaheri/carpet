"use client";

import { Heart, Search, ShoppingBag, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Monogram } from "@/components/shared/monogram";
import { formatNumber } from "@/lib/format";
import { paths } from "@/lib/paths";
import { cn } from "@/lib/utils";

import { useShowroom } from "./showroom-store";

const nav = [
  { href: paths.collection, label: "مجموعه" },
  { href: paths.visualizer, label: "پیش‌نمایش اتاق" },
  { href: paths.encyclopedia, label: "دانشنامه" },
  { href: paths.heritage, label: "میراث" },
];

export function SiteHeader() {
  const { search, setSearch, wishlist, selection, setDrawerOpen, setFilter } = useShowroom();
  const [scrolled, setScrolled] = useState(false);
  const onHome = usePathname() === paths.home;
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const showCollection = () =>
    document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" });
  // The gallery lives on the home page; elsewhere, searching or opening the wishlist goes there. The
  // header sits in the shared layout, so the search box keeps its focus across the move.
  const openGallery = (param: "q" | "filter", value: string) =>
    router.push(`${paths.home}?${new URLSearchParams({ [param]: value })}#collection`);

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-4 pt-4 print:hidden">
      <div
        className={cn(
          "mx-auto flex max-w-7xl items-center gap-4 rounded-full border px-5 py-2.5 backdrop-blur-md transition-all duration-500",
          scrolled ? "bg-card/85 shadow-lift" : "border-transparent bg-card/50",
        )}
      >
        <Link
          href={paths.top}
          aria-label="فرش، بازگشت به بالای صفحه"
          className="flex items-center gap-3 rounded-full"
        >
          <Monogram />
          <span className="hidden font-display text-2xl sm:block">
            فرش{" "}
            <span className="text-lg text-muted-foreground italic" dir="ltr" lang="en">
              Farsh
            </span>
          </span>
        </Link>
        <nav
          aria-label="بخش‌های صفحه"
          className="ms-6 hidden gap-6 text-sm text-muted-foreground lg:flex"
        >
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-1.5">
          <label className="hidden items-center gap-2 rounded-full border bg-background/70 px-3 py-1.5 md:flex">
            <Search className="size-4 text-muted-foreground" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                if (!onHome) return openGallery("q", e.target.value);
                setSearch(e.target.value);
                showCollection();
              }}
              placeholder="جست‌وجوی فرش"
              aria-label="جست‌وجوی فرش"
              className="w-36 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>
          <button
            type="button"
            aria-label={`برگزیده‌ها، ${formatNumber(wishlist.length)} فرش`}
            disabled={wishlist.length === 0}
            onClick={() => {
              if (!onHome) return openGallery("filter", "wishlist");
              setFilter("wishlist");
              showCollection();
            }}
            className="relative rounded-full p-2 transition-colors hover:bg-muted disabled:cursor-default disabled:hover:bg-transparent"
          >
            <Heart className="size-5" aria-hidden />
            {wishlist.length > 0 ? <CountBadge count={wishlist.length} /> : null}
          </button>
          <button
            type="button"
            aria-label={`فهرست استعلام، ${formatNumber(selection.length)} فرش`}
            onClick={() => setDrawerOpen(true)}
            className="relative rounded-full p-2 transition-colors hover:bg-muted"
          >
            <ShoppingBag className="size-5" aria-hidden />
            {selection.length > 0 ? <CountBadge count={selection.length} /> : null}
          </button>
          <Link
            href={paths.dashboard}
            aria-label="حساب کاربری"
            className="rounded-full p-2 transition-colors hover:bg-muted"
          >
            <UserRound className="size-5" aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  );
}

function CountBadge({ count }: { count: number }) {
  return (
    <span className="absolute -end-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-gold text-[10px] text-foreground">
      {count.toLocaleString("fa-IR")}
    </span>
  );
}
