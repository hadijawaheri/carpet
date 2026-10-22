"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fa" dir="rtl">
      <body style={{ fontFamily: "Tahoma, sans-serif", padding: 24 }}>
        <h1>مشکلی پیش آمد</h1>
        <p>صفحه بارگذاری نشد.</p>
        <button type="button" onClick={reset}>
          تلاش دوباره
        </button>
      </body>
    </html>
  );
}
