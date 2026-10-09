export const paths = {
  home: "/",
  carpets: "/carpets",
  carpet: (slug: string) => `/carpets/${slug}`,
  research: "/research",
  article: (slug: string) => `/research/${slug}`,
} as const;
