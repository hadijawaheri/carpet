import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { materialLabels } from "@/features/carpet-viewer";
import { requireRole } from "@/lib/auth/dal";
import { formatPriceRial, formatSizeCm } from "@/lib/format";
import { paths } from "@/lib/paths";

import { getAdminCarpets } from "../data/get-admin-carpets";
import { AdminShell } from "./admin-shell";

export async function CatalogueScreen() {
  await requireRole("admin", paths.catalogue);
  const carpets = await getAdminCarpets();

  return (
    <AdminShell
      title="فرش‌های ویترین"
      back={{ href: paths.profile, label: "حساب کاربری" }}
      action={
        <Button asChild>
          <Link href={paths.catalogueNew}>افزودن فرش</Link>
        </Button>
      }
    >
      {carpets.length === 0 ? (
        <p className="text-muted-foreground">
          هنوز فرشی ثبت نشده است. با «افزودن فرش» اولین را بگذارید.
        </p>
      ) : (
        <ul className="flex flex-col divide-y border-y">
          {carpets.map((carpet) => (
            <li key={carpet.slug}>
              <Link
                href={paths.catalogueCarpet(carpet.slug)}
                className="flex items-center gap-5 py-4 transition hover:bg-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <div className="relative aspect-[3/4] w-16 shrink-0 bg-alabaster">
                  <Image src={carpet.image} alt="" fill sizes="64px" className="object-contain" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-lg">{carpet.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {materialLabels[carpet.material]} ·{" "}
                    {formatSizeCm(carpet.widthCm, carpet.lengthCm)} ·{" "}
                    {formatPriceRial(carpet.priceRial)}
                  </span>
                </div>
                {carpet.isPlaceholder ? (
                  <span className="shrink-0 eyebrow text-gold-text">عکس موقت</span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
