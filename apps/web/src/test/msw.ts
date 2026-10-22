import { setupServer } from "msw/node";

/** Component tests' stand-in for the API; each test adds the handlers it needs with server.use. */
export const server = setupServer();
