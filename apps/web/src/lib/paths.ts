export const paths = {
  home: "/",
  designHub: "/design-hub",
  carpets: "/carpets",
  carpet: (slug: string) => `/carpets/${slug}`,
  research: "/research",
  article: (slug: string) => `/research/${slug}`,
} as const;
