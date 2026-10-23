import * as Sentry from "@sentry/nextjs";

// Server and edge errors go to Sentry only when SENTRY_DSN is set at runtime
export function register() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0,
    dataCollection: { userInfo: false, cookies: false, httpHeaders: false, httpBodies: [] },
  });
}

export const onRequestError = Sentry.captureRequestError;
