# Next.js standalone server. Build from the repo root:
#   docker build -f infra/docker/web.Dockerfile -t farsh-web .
ARG NODE_IMAGE=node:22-alpine

FROM ${NODE_IMAGE} AS build
WORKDIR /repo
RUN corepack enable
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc* ./
COPY apps/web/package.json apps/web/
COPY packages/contracts/package.json packages/contracts/
RUN pnpm install --frozen-lockfile --filter @farsh/web... --ignore-scripts
COPY tsconfig.base.json ./
COPY packages/contracts packages/contracts
COPY apps/web apps/web
# Baked into the /api rewrite at build time
ARG INTERNAL_API_URL=http://api:7781
ENV INTERNAL_API_URL=${INTERNAL_API_URL} NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @farsh/contracts build && pnpm --filter @farsh/web build

FROM ${NODE_IMAGE}
WORKDIR /app
ENV NODE_ENV=production PORT=7782 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
COPY --from=build --chown=node:node /repo/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /repo/apps/web/public ./apps/web/public
USER node
EXPOSE 7782
CMD ["node", "apps/web/server.js"]
