import Link from "next/link";

import { Button } from "@/components/ui/button";
import { paths } from "@/lib/paths";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-start justify-center gap-4 px-4">
      <p className="font-mono text-sm text-muted-foreground" dir="ltr">
        404
      </p>
      <h1 className="font-display text-4xl font-bold">این صفحه پیدا نشد</h1>
      <p className="text-muted-foreground">ممکن است نشانی اشتباه باشد یا صفحه جابه‌جا شده باشد.</p>
      <Button asChild>
        <Link href={paths.home}>بازگشت به صفحه‌ی اصلی</Link>
      </Button>
    </main>
  );
}
