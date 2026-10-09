"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
