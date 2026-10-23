import * as Sentry from "@sentry/nextjs";

// NEXT_PUBLIC_ values are baked in at build time; without one the browser sends nothing
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    // Sent to our own /monitoring route (next.config.ts), so the CSP stays connect-src 'self'
    tunnel: "/monitoring",
    tracesSampleRate: 0,
    dataCollection: { userInfo: false, cookies: false, httpHeaders: false, httpBodies: [] },
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
