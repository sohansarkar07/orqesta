FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build CLI + Web
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy built artifacts and dependencies
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/web/dist ./web/dist
COPY --from=builder /app/server ./server

# Install production dependencies only
RUN npm ci --only=production

EXPOSE 3001

# Start Express server (serves API + static React files)
CMD ["node", "dist/server/index.js"]
