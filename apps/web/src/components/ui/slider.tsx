"use client";

import { Slider as SliderPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/** A single-thumb slider. Radix puts no name on its thumb, so `label` is required. */
export function Slider({
  className,
  label,
  ...props
}: ComponentProps<typeof SliderPrimitive.Root> & { label: string }) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn("relative flex h-8 w-full touch-none items-center select-none", className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-border">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        aria-label={label}
        className="block size-5 cursor-grab rounded-full border-2 border-primary bg-card shadow-mount outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card active:cursor-grabbing"
      />
    </SliderPrimitive.Root>
  );
}
