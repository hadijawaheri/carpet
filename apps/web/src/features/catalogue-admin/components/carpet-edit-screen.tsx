import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/dal";
import { paths } from "@/lib/paths";

import { getAdminCarpet } from "../data/get-admin-carpets";
import { AdminShell, catalogueBack } from "./admin-shell";
import { CarpetForm } from "./carpet-form";
import { DeleteCarpet } from "./delete-carpet";

export async function CarpetEditScreen({ slug }: { slug: string }) {
  await requireRole("admin", paths.catalogueCarpet(slug));
  const carpet = await getAdminCarpet(slug);
  if (!carpet) notFound();

  return (
    <AdminShell title={carpet.name} back={catalogueBack}>
      <CarpetForm carpet={carpet} />
      <DeleteCarpet slug={carpet.slug} name={carpet.name} />
    </AdminShell>
  );
}
