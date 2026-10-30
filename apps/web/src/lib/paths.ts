export const paths = {
  home: "/",
  top: "/#top",
  collection: "/#collection",
  visualizer: "/#visualizer",
  heritage: "/#heritage",
  carpet: (slug: string) => `/carpets/${slug}`,
  certificate: (slug: string) => `/carpets/${slug}/certificate`,
  carpetModel: (slug: string, format: "glb" | "usdz", version: string) =>
    `/carpets/${slug}/model.${format}?v=${version}`,
  encyclopedia: "/encyclopedia",
  article: (slug: string) => `/encyclopedia/${slug}`,
  knotCalculator: "/encyclopedia/knot-calculator",
  signIn: "/sign-in",
  dashboard: "/dashboard",
  profile: "/dashboard/profile",
  catalogue: "/dashboard/catalogue",
  catalogueNew: "/dashboard/catalogue/new",
  // Under /edit so that a carpet whose slug is "new" never collides with the create page
  catalogueCarpet: (slug: string) => `/dashboard/catalogue/edit/${slug}`,
} as const;
