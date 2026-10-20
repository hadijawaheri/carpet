import Link from "next/link";

import { Button } from "@/components/ui/button";
import { paths } from "@/lib/paths";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-start justify-center gap-4 px-6">
      <p className="eyebrow text-gold-text">۴۰۴</p>
      <h1 className="text-5xl">این صفحه پیدا نشد</h1>
      <p className="text-muted-foreground">ممکن است نشانی اشتباه باشد یا صفحه جابه‌جا شده باشد.</p>
      <Button asChild>
        <Link href={paths.home}>بازگشت به گالری</Link>
      </Button>
    </main>
  );
}
