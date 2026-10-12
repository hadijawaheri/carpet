import type { Metadata } from "next";

import { SiteHeader } from "@/components/layout/site-header";
import { carpets } from "@/features/catalog";
import { RoomDesigner } from "@/features/room-designer";

export const metadata: Metadata = {
  title: "اتاق‌ساز",
  description:
    "فرش را در یک اتاق سه‌بعدی بگذارید، مبل و میز و تابلو و پرده را با هر رنگ بچینید و قبل از خرید ببینید.",
};

export default function RoomPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <h1 className="sr-only">اتاق‌ساز: فرش را در اتاق خودتان ببینید</h1>
        <RoomDesigner carpets={carpets} />
      </main>
    </>
  );
}
