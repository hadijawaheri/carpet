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
    <Table>
      <TableCaption className="text-start">
        رج: گره در ۷ سانتی‌متر عرض. شانه: نقطه‌ی پرز در یک متر عرض؛ تراکم: همان در یک متر طول.
        نقطه‌های فرش ماشینی گره‌ی واقعی نیستند.
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
  );
}
