import { requireSession } from "@/lib/auth/dal";
import { paths } from "@/lib/paths";

import { ProfilePanel } from "./profile-panel";

export async function ProfileScreen() {
  const user = await requireSession(paths.profile);
  return <ProfilePanel initialUser={user} />;
}
