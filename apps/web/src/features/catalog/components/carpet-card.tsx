import type { Carpet } from "@farsh/contracts";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { materialLabels } from "@/features/carpet-viewer";
import { formatDensity } from "@/lib/density";
import { formatSizeCm } from "@/lib/format";
import { cn } from "@/lib/utils";

/** `href` is optional because product pages arrive in a later stage; the card must not link to a 404. */
export function CarpetCard({
  carpet,
  href,
  className,
}: {
  carpet: Carpet;
  href?: string;
  className?: string;
}) {
  const title = href ? (
    <Link href={href} className="after:absolute after:inset-0 focus-visible:outline-none">
      {carpet.name}
    </Link>
  ) : (
    carpet.name
  );

  return (
    <Card
      className={cn(
        "group relative gap-0 shadow-none transition-shadow duration-500 ease-settle hover:shadow-lift has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring",
        className,
      )}
    >
      <div
        className="relative overflow-hidden bg-muted"
        style={{ aspectRatio: carpet.imageAspect }}
      >
        <Image
          src={carpet.image}
          alt={`فرش ${carpet.name}`}
          fill
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
          className="object-cover transition-transform duration-700 ease-settle group-hover:scale-[1.03]"
        />
        {carpet.isPlaceholder ? (
          <Badge variant="muted" className="absolute start-3 top-3">
            عکس موقت
          </Badge>
        ) : null}
      </div>
      <CardHeader className="pb-1">
        <Badge variant="outline">{materialLabels[carpet.material]}</Badge>
        <CardTitle className="mt-2">{title}</CardTitle>
        <CardDescription>{formatSizeCm(carpet.widthCm, carpet.lengthCm)}</CardDescription>
      </CardHeader>
      <CardContent className="pb-5">
        <p className="text-spec text-muted-foreground">
          {carpet.density ? formatDensity(carpet.density) : "تراکم ثبت نشده"}
        </p>
      </CardContent>
    </Card>
  );
}
