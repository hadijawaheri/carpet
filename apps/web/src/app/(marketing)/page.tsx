import { carpets } from "@/features/catalog";
import { Closing, GalleryExperience } from "@/features/gallery";

export default function HomePage() {
  return (
    <>
      <GalleryExperience carpets={carpets} />
      <Closing />
    </>
  );
}
