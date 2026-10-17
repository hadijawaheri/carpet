import { carpets } from "@/features/catalog";
import { Closing, GalleryExperience, ResearchCatalogue } from "@/features/gallery";

export default function HomePage() {
  return (
    <>
      <GalleryExperience carpets={carpets} after={<ResearchCatalogue />} />
      <Closing />
    </>
  );
}
