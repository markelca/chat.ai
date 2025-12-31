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

# Debug: Check standalone output structure
RUN echo "=== Checking standalone structure ===" && \
    ls -la .next/standalone/ && \
    echo "=== Looking for server.js ===" && \
    find .next/standalone -name "server.js" -type f && \
    echo "=== Checking standalone node_modules ===" && \
    ls -la .next/standalone/node_modules/ 2>/dev/null | head -20 && \
    echo "=== Checking for next in standalone ===" && \
    ls -la .next/standalone/node_modules/next 2>/dev/null || echo "next not found in standalone node_modules"

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone build (includes full monorepo structure)
COPY --from=builder --chown=nextjs:nodejs /app/packages/web/.next/standalone ./

# Copy static files to the correct location within standalone structure
COPY --from=builder --chown=nextjs:nodejs /app/packages/web/.next/static ./packages/web/.next/static

# Copy public directory to the correct location
COPY --from=builder --chown=nextjs:nodejs /app/packages/web/public ./packages/web/public

# Debug: List structure to verify paths
RUN ls -la . && \
    echo "=== Checking for server.js ===" && \
    find . -name "server.js" -type f 2>/dev/null | head -5 && \
    echo "=== Checking packages structure ===" && \
    ls -la packages/ 2>/dev/null || echo "No packages dir" && \
    echo "=== Checking packages/web ===" && \
    ls -la packages/web/ 2>/dev/null || echo "No packages/web" && \
    echo "=== Checking node_modules ===" && \
    ls -la node_modules/ | head -10 && \
    echo "=== Looking for next module ===" && \
    find . -type d -name "next" 2>/dev/null | grep node_modules | head -5

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "packages/web/server.js"]
