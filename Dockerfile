FROM node:18-alpine AS builder

WORKDIR /app

# Install backend dependencies
COPY package*.json ./
RUN npm ci

# Install frontend dependencies
COPY web/package*.json ./web/
RUN cd web && npm ci

# Copy all source
COPY . .

# Build backend (TypeScript → dist/)
RUN npm run build

# Build frontend (React → web/dist/)
RUN cd web && npm run build

# ─── Production image ─────────────────────────────────────────────────────────
FROM node:18-alpine

WORKDIR /app

# Production backend dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Built artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/web/dist ./web/dist

EXPOSE 3001

# The Express server serves both the API and the React frontend in production
CMD ["node", "dist/server/index.js"]
