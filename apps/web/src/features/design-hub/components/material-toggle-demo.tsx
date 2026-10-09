"use client";

import type { PileMaterial } from "@farsh/contracts";
import { useState } from "react";

import { MaterialToggle } from "@/features/carpet-viewer";

export function MaterialToggleDemo() {
  const [material, setMaterial] = useState<PileMaterial>("silk");
  return <MaterialToggle value={material} onValueChange={setMaterial} />;
}
