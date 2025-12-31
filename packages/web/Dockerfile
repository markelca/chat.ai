# Multi-stage build for Next.js app in monorepo

FROM node:20-alpine AS base
RUN corepack enable pnpm

# Install dependencies for the entire monorepo
FROM base AS deps
WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy all package.json files
COPY packages/shared/package.json ./packages/shared/
COPY packages/web/package.json ./packages/web/

# Install all dependencies for the entire workspace
# This installs deps in node_modules/.pnpm and creates symlinks
RUN pnpm install --frozen-lockfile

# Debug: Check pnpm store structure
RUN echo "=== Checking pnpm store ===" && \
    ls -la node_modules/.pnpm/ | head -20 && \
    echo "=== Checking shared package node_modules ===" && \
    ls -la packages/shared/node_modules/ && \
    echo "=== Checking if redis exists in .pnpm store ===" && \
    ls -la node_modules/.pnpm/redis*/node_modules/redis 2>/dev/null || echo "Redis not found in .pnpm store"

# Build the application
FROM base AS builder
WORKDIR /app

# Copy workspace config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# CRITICAL: Copy the entire node_modules directory including .pnpm store
# This preserves pnpm's symlink structure
COPY --from=deps /app/node_modules ./node_modules

# Copy package directories with their node_modules (contains symlinks to .pnpm)
COPY --from=deps /app/packages/shared ./packages/shared
COPY --from=deps /app/packages/web ./packages/web

# Now copy source code (will overwrite package.json but preserve node_modules)
COPY packages/shared ./packages/shared
COPY packages/web ./packages/web

# Verify the symlink structure is intact
RUN echo "=== Verifying redis module access ===" && \
    ls -la packages/shared/node_modules/redis && \
    echo "=== Testing redis require ===" && \
    cd packages/shared && node -e "require('redis'); console.log('Redis accessible from shared!');"

# Build the web app
WORKDIR /app/packages/web
RUN pnpm build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/packages/web/public ./public

# Copy standalone build
COPY --from=builder --chown=nextjs:nodejs /app/packages/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/packages/web/.next/static ./packages/web/.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "packages/web/server.js"]
