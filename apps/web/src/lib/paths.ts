export const paths = {
  home: "/",
  top: "/#top",
  collection: "/#collection",
  visualizer: "/#visualizer",
  heritage: "/#heritage",
  carpet: (slug: string) => `/carpets/${slug}`,
  certificate: (slug: string) => `/carpets/${slug}/certificate`,
  encyclopedia: "/encyclopedia",
  article: (slug: string) => `/encyclopedia/${slug}`,
  signIn: "/sign-in",
  dashboard: "/dashboard",
  profile: "/dashboard/profile",
} as const;
