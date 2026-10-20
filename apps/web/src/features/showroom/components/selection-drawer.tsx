"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { Dialog } from "radix-ui";

import { materialLabels } from "@/features/carpet-viewer";
import { InquiryForm } from "@/features/inquiry";
import { formatPriceRial, formatSizeCm } from "@/lib/format";

import { useShowroom } from "./showroom-store";

/** The design's cart drawer, as an inquiry list: Persian carpets are sold after a conversation. */
export function SelectionDrawer() {
  const { selection, drawerOpen, setDrawerOpen, removeFromSelection, clearSelection } =
    useShowroom();

  return (
    <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/30 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed inset-y-0 end-0 z-50 flex w-full max-w-md flex-col bg-background linen shadow-2xl outline-none data-[state=closed]:animate-out data-[state=closed]:duration-500 data-[state=open]:animate-in data-[state=open]:duration-500 ltr:data-[state=closed]:slide-out-to-right ltr:data-[state=open]:slide-in-from-right rtl:data-[state=closed]:slide-out-to-left rtl:data-[state=open]:slide-in-from-left">
          <div className="flex items-center justify-between border-b p-6">
            <Dialog.Title className="font-display text-3xl font-medium">
              فهرست انتخاب شما
            </Dialog.Title>
            <Dialog.Close aria-label="بستن فهرست" className="rounded-full p-1">
              <X className="size-5" aria-hidden />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            فرش‌هایی که انتخاب کرده‌اید و فرم درخواست استعلام قیمت
          </Dialog.Description>
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
            {selection.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                فهرست شما خالی است. هر فرش یکتاست؛ از گالری یکی را انتخاب کنید.
              </p>
            ) : null}
            {selection.map((carpet) => (
              <div key={carpet.slug} className="flex gap-4">
                <div className="relative h-24 w-18 shrink-0">
                  <Image
                    src={carpet.image}
                    alt={carpet.name}
                    fill
                    sizes="72px"
                    className="rounded-sm object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-display text-xl">{carpet.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {materialLabels[carpet.material]} ·{" "}
                    {formatSizeCm(carpet.widthCm, carpet.lengthCm)}
                  </p>
                  <p className="mt-1 text-sm">{formatPriceRial(carpet.priceRial)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFromSelection(carpet.slug)}
                  className="self-start text-xs text-muted-foreground underline underline-offset-4"
                >
                  حذف
                </button>
              </div>
            ))}
          </div>
          <div className="border-t p-6">
            <InquiryForm carpetSlugs={selection.map((c) => c.slug)} onSent={clearSelection} />
            <p className="mt-3 text-center text-xs text-muted-foreground">
              تحویل بیمه‌شده و دست‌به‌دست، هماهنگ با شما
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
