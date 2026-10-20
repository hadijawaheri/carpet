# NestJS API. Build from the repo root:
#   docker build -f infra/docker/api.Dockerfile -t farsh-api .
ARG NODE_IMAGE=node:22-alpine

FROM ${NODE_IMAGE} AS build
WORKDIR /repo
RUN corepack enable
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc* ./
COPY apps/api/package.json apps/api/
COPY packages/contracts/package.json packages/contracts/
RUN pnpm install --frozen-lockfile --filter @farsh/api... --ignore-scripts
COPY tsconfig.base.json ./
COPY packages/contracts packages/contracts
COPY apps/api apps/api
RUN pnpm --filter @farsh/contracts build && pnpm --filter @farsh/api build \
  && pnpm --filter @farsh/api deploy --prod --legacy /out

FROM ${NODE_IMAGE}
WORKDIR /app
ENV NODE_ENV=production PORT=7781 HOST=0.0.0.0
COPY --from=build --chown=node:node /out ./
USER node
EXPOSE 7781
# Migrations and indexes run before the server, so a new image never meets an old schema
CMD ["sh", "-c", "node dist/cli/migrate.js && node dist/cli/seed.js --indexes-only && exec node dist/main.js"]
