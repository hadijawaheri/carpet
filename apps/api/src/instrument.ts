import * as Sentry from "@sentry/nestjs";

// Imported first by main.ts so Sentry can hook http and the Mongo driver before they load.
// Without SENTRY_DSN nothing is sent and captureException is a no-op.
const dsn = process.env.SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "development",
    release: process.env.SENTRY_RELEASE,
    // Errors only; traces would need a sampling and cost decision first
    tracesSampleRate: 0,
    // Mobiles (request bodies), session cookies and headers stay out of Sentry, as out of the logs
    dataCollection: { userInfo: false, cookies: false, httpHeaders: false, httpBodies: [] },
  });
}
