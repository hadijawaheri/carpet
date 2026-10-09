import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "فرش · Farsh",
    short_name: "فرش",
    lang: "fa",
    dir: "rtl",
    start_url: "/",
    display: "standalone",
    background_color: "#6c1116",
    theme_color: "#6c1116",
  };
}
