# Multi-stage build. The rag-core workspace is built first, then the server.
FROM node:22-alpine AS builder
WORKDIR /repo

# Copy the workspace manifests first for better layer caching.
COPY package.json package-lock.json* tsconfig.base.json ./
COPY packages/rag-core/package.json ./packages/rag-core/
COPY server/package.json ./server/

# Install only the rag-core + server workspaces (skip the Expo app).
RUN npm install --workspace packages/rag-core --workspace server --include-workspace-root

# Build rag-core, then the server.
COPY packages/rag-core ./packages/rag-core
COPY server ./server
RUN npm run build --workspace packages/rag-core \
  && npm run build --workspace server

# ── Runtime image ────────────────────────────────────────────────────────────
FROM node:22-alpine
WORKDIR /repo
ENV NODE_ENV=production

COPY package.json package-lock.json* tsconfig.base.json ./
COPY packages/rag-core/package.json ./packages/rag-core/
COPY server/package.json ./server/
RUN npm install --omit=dev --workspace packages/rag-core --workspace server --include-workspace-root

COPY --from=builder /repo/packages/rag-core/dist ./packages/rag-core/dist
COPY --from=builder /repo/server/dist ./server/dist

EXPOSE 8787
CMD ["node", "server/dist/index.js"]
