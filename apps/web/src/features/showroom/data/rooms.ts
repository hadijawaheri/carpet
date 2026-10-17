export interface Room {
  id: string;
  label: string;
  image: string;
}

// From the heritage-loom design; the two warm rooms are cropped so no generated carpet remains in shot.
export const rooms: Room[] = [
  { id: "modern", label: "مینیمال مدرن", image: "/rooms/modern.jpg" },
  { id: "classic", label: "نشیمن کلاسیک", image: "/rooms/classic.jpg" },
  { id: "executive", label: "اتاق کار", image: "/rooms/executive.jpg" },
];
