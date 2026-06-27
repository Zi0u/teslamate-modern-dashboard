# ============================================
# Stage 1: Build — compile TypeScript + Vite
# ============================================
FROM node:26-alpine AS builder

WORKDIR /app

# Copy package files first (Docker layer caching: deps change rarely)
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/

# Install ALL dependencies (devDeps needed for building)
RUN npm ci

# Copy source code
COPY backend/ backend/
COPY frontend/ frontend/

# Build backend (tsc: src/ → dist/)
RUN npm run build --workspace=backend

# Build frontend (vite: src/ → dist/)
RUN npm run build --workspace=frontend

# ============================================
# Stage 2: Runtime — lean production image
# ============================================
FROM node:26-alpine

# tini: proper init for signal handling when Node runs as PID 1
RUN apk add --no-cache tini

ENV NODE_ENV=production

WORKDIR /app

# Copy package files for npm workspaces
COPY package.json package-lock.json ./
COPY backend/package.json backend/

# Stub frontend package.json (workspaces requires it, but no deps needed)
RUN mkdir -p frontend && echo '{"name":"frontend","private":true}' > frontend/package.json

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled backend from builder
COPY --from=builder /app/backend/dist/ backend/dist/

# Copy frontend static files from builder
COPY --from=builder /app/frontend/dist/ frontend/dist/

# Run as the built-in non-root user (read-only dashboard, no writes needed)
USER node

EXPOSE 3001

WORKDIR /app/backend

# Mark the container unhealthy if the API stops responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3001/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/sbin/tini", "--"]

CMD ["node", "dist/index.js"]
