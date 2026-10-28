import { Gallery } from "./gallery";
import { Hero } from "./hero";
import { RoomVisualizer } from "./room-visualizer";

export function ShowroomPage() {
  return (
    <main>
      <Hero />
      <Gallery />
      <RoomVisualizer />
    </main>
  );
}
