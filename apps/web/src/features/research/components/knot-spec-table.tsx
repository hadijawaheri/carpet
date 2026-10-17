import type { KnotDensity, MaterialSpec } from "@farsh/contracts";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { materialLabels } from "@/features/carpet-viewer";
import { formatDensity, knotsPerSquareMetre } from "@/lib/density";
import { formatCompact } from "@/lib/format";

function knotsLabel(density: KnotDensity) {
  const knots = knotsPerSquareMetre(density);
  return knots === null ? "؟" : formatCompact(knots);
}

export function KnotSpecTable({ specs }: { specs: MaterialSpec[] }) {
  return (
    <>
      {/* Four columns do not fit a phone; below sm each material becomes its own block. */}
      <div className="flex flex-col sm:hidden">
        {specs.map((s) => (
          <dl
            key={s.material}
            className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-t border-border py-4 text-spec first:border-t-0 first:pt-0"
          >
            <dt className="col-span-2 text-body font-semibold">{materialLabels[s.material]}</dt>
            <dt className="text-muted-foreground">بازه‌ی رایج</dt>
            <dd>
              {formatDensity(s.low)} تا {formatDensity(s.high)}
            </dd>
            <dt className="text-muted-foreground">در هر متر مربع</dt>
            <dd className="tabular-nums">
              {knotsLabel(s.low)} تا {knotsLabel(s.high)}
            </dd>
            <dt className="text-muted-foreground">حس در دست</dt>
            <dd className="text-muted-foreground">{s.feel}</dd>
          </dl>
        ))}
        <p className="pt-3 text-label text-muted-foreground">
          بازه‌ها پیش‌نویس‌اند و هنوز منبع ندارند.
        </p>
      </div>
      <div className="hidden sm:block">
        <Table>
          <TableCaption className="text-start">
            رج: گره در ۷ سانتی‌متر عرض. شانه: نقطه‌ی پرز در یک متر عرض؛ تراکم: همان در یک متر طول.
            نقطه‌های فرش ماشینی گره‌ی واقعی نیستند. بازه‌ها پیش‌نویس‌اند و هنوز منبع ندارند.
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>جنس</TableHead>
              <TableHead>بازه‌ی رایج</TableHead>
              <TableHead>در هر متر مربع</TableHead>
              <TableHead>حس در دست</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {specs.map((s) => (
              <TableRow key={s.material}>
                <TableCell className="pe-4 font-semibold whitespace-nowrap">
                  {materialLabels[s.material]}
                </TableCell>
                <TableCell className="pe-4 text-spec whitespace-nowrap">
                  {formatDensity(s.low)}
                  <span className="block text-muted-foreground">تا {formatDensity(s.high)}</span>
                </TableCell>
                <TableCell className="pe-4 text-spec whitespace-nowrap tabular-nums">
                  {knotsLabel(s.low)} تا {knotsLabel(s.high)}
                </TableCell>
                <TableCell className="min-w-48 text-muted-foreground">{s.feel}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
