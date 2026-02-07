# ============================================
# Stage 1: Build — compile TypeScript + Vite
# ============================================
FROM node:20-alpine AS builder

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
FROM node:20-alpine

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

EXPOSE 3001

WORKDIR /app/backend

CMD ["node", "dist/index.js"]
