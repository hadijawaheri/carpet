import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "فرش · Farsh",
    short_name: "فرش",
    lang: "fa",
    dir: "rtl",
    start_url: "/",
    display: "standalone",
    background_color: "#faf7f2",
    theme_color: "#1a1a1a",
  };
}
