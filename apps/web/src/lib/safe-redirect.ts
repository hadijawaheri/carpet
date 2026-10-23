import { paths } from "./paths";

/** Only same-site paths: `?next=https://evil.example` or `//evil.example` would be an open redirect. */
export function safeRedirect(next: string | null | undefined, fallback: string = paths.dashboard) {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\")
    ? next
    : fallback;
}
