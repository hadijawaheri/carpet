import { getCarpets } from "../data/get-carpets";
import { Gallery } from "./gallery";
import { Hero } from "./hero";
import { QuickView } from "./quick-view";
import { RoomVisualizer } from "./room-visualizer";
import { SelectionDrawer } from "./selection-drawer";
import { ShowroomProvider } from "./showroom-store";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export async function ShowroomPage() {
  const carpets = await getCarpets();
  return (
    <ShowroomProvider carpets={carpets}>
      <SiteHeader />
      <main>
        <Hero />
        <Gallery />
        <RoomVisualizer />
      </main>
      <SiteFooter />
      <SelectionDrawer />
      <QuickView />
    </ShowroomProvider>
  );
}
