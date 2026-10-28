import type { ReactNode } from "react";

import { getCarpets } from "../data/get-carpets";
import { QuickView } from "./quick-view";
import { SelectionDrawer } from "./selection-drawer";
import { ShowroomProvider } from "./showroom-store";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

/**
 * The frame every public page shares. It lives in the (marketing) layout, so the wishlist and the
 * inquiry list survive moving between the gallery and a carpet's own page.
 */
export async function ShowroomShell({ children }: { children: ReactNode }) {
  const carpets = await getCarpets();
  return (
    <ShowroomProvider carpets={carpets}>
      <SiteHeader />
      {children}
      <SiteFooter />
      <SelectionDrawer />
      <QuickView />
    </ShowroomProvider>
  );
}
