import { requireRole } from "@/lib/auth/dal";
import { paths } from "@/lib/paths";

import { AdminShell, catalogueBack } from "./admin-shell";
import { CarpetForm } from "./carpet-form";

export async function CarpetCreateScreen() {
  await requireRole("admin", paths.catalogueNew);
  return (
    <AdminShell title="فرش تازه" back={catalogueBack}>
      <CarpetForm />
    </AdminShell>
  );
}
