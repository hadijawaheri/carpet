"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-start justify-center gap-4 px-4">
      <h1 className="font-display text-4xl font-bold">مشکلی پیش آمد</h1>
      <p className="text-muted-foreground">صفحه بارگذاری نشد. دوباره تلاش کنید.</p>
      <Button onClick={reset}>تلاش دوباره</Button>
    </main>
  );
}
