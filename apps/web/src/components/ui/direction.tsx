"use client";

import { Direction } from "radix-ui";
import type { ComponentProps } from "react";

export function DirectionProvider(props: ComponentProps<typeof Direction.DirectionProvider>) {
  return <Direction.DirectionProvider {...props} />;
}
