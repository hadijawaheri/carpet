import { redirect } from "next/navigation";

import { paths } from "@/lib/paths";

export default function Page() {
  redirect(paths.profile);
}
