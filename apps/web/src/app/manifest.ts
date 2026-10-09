import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "فرش · Farsh",
    short_name: "فرش",
    lang: "fa",
    dir: "rtl",
    start_url: "/",
    display: "standalone",
    background_color: "#f3e9d6",
    theme_color: "#9e1b1f",
  };
}
