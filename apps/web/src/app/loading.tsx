import { Monogram } from "@/components/shared/monogram";

export default function Loading() {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-6"
      role="status"
      aria-label="در حال بارگذاری"
    >
      <Monogram className="size-12 animate-pulse" />
      <span className="font-display text-3xl">فرش</span>
    </div>
  );
}
