import { type Carpet, carpetSchema } from "@farsh/contracts";

// Stand-ins until the owner supplies the final product photos; material and size are placeholders too.
const placeholderCarpets = [
  {
    slug: "medallion-black",
    name: "ترنج تیره",
    material: "silk",
    widthCm: 150,
    lengthCm: 225,
    image: "/carpets/medallion-black.jpg",
    imageAspect: 0.6558,
    isPlaceholder: true,
  },
  {
    slug: "three-medallion",
    name: "سه ترنج",
    material: "machine",
    widthCm: 200,
    lengthCm: 300,
    density: { unit: "shaneh", value: 1200, takham: 3600 },
    image: "/carpets/three-medallion.jpg",
    imageAspect: 0.6797,
    isPlaceholder: true,
  },
  {
    slug: "mashhad-navy",
    name: "حاشیه لاجوردی",
    material: "wool",
    widthCm: 200,
    lengthCm: 310,
    density: { unit: "raj", value: 40 },
    image: "/carpets/mashhad-navy.jpg",
    imageAspect: 0.6431,
    isPlaceholder: true,
  },
  {
    slug: "navy-medallion",
    name: "ترنج سرمه‌ای",
    material: "silk",
    widthCm: 150,
    lengthCm: 245,
    density: { unit: "raj", value: 70 },
    image: "/carpets/navy-medallion.jpg",
    imageAspect: 0.6093,
    isPlaceholder: true,
  },
  {
    slug: "kashan-red",
    name: "کاشان سرخ",
    material: "wool",
    widthCm: 200,
    lengthCm: 345,
    density: { unit: "raj", value: 50 },
    image: "/carpets/kashan-red.jpg",
    imageAspect: 0.5768,
    isPlaceholder: true,
  },
] satisfies Carpet[];

export const carpets: Carpet[] = placeholderCarpets.map((c) => carpetSchema.parse(c));
