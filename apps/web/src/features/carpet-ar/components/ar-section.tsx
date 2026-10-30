import type { Carpet } from "@farsh/contracts";

import { paths } from "@/lib/paths";
import { qrDataUri } from "@/lib/qr";
import { absoluteUrl } from "@/lib/seo";
import { cn } from "@/lib/utils";

import { modelVersion } from "../model/model-version";
import { ViewInRoom } from "./view-in-room";

/** "See it in my room": the carpet at its real size on the visitor's own floor, through the phone's AR viewer. */
export async function ArSection({ carpet, className }: { carpet: Carpet; className?: string }) {
  const version = modelVersion(carpet);
  const pagePath = paths.carpet(carpet.slug);
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <ViewInRoom
        name={carpet.name}
        image={carpet.image}
        glbPath={paths.carpetModel(carpet.slug, "glb", version)}
        usdzPath={paths.carpetModel(carpet.slug, "usdz", version)}
        pagePath={pagePath}
        qr={await qrDataUri(absoluteUrl(pagePath))}
      />
      {carpet.isPlaceholder ? (
        <p className="text-xs text-muted-foreground">
          اندازه‌ی این فرش هنوز نهایی نشده است؛ در اتاق با اندازه‌ی ثبت‌شده دیده می‌شود.
        </p>
      ) : null}
    </div>
  );
}
