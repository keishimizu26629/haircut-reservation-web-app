# Multi-stage build for Nuxt 3 with Firebase integration
FROM node:20-alpine AS base

# Install dependencies for better performance
RUN apk add --no-cache libc6-compat git

# Set working directory
WORKDIR /app

# Create app user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nuxtjs

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps && npm cache clean --force

# Development stage
FROM base AS development

# Install all dependencies (including dev)
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Create necessary directories with proper permissions
RUN mkdir -p /app/.nuxt /app/node_modules/.cache && \
    chown -R nuxtjs:nodejs /app

# Change ownership to nuxtjs user
USER nuxtjs

# Expose port
EXPOSE 3000

# Development command with hot reload
CMD ["npm", "run", "dev"]

# Build stage for production
FROM base AS builder

# Install all dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM base AS production

# Copy built application
COPY --from=builder --chown=nuxtjs:nodejs /app/.output /app/.output

# Change to nuxtjs user
USER nuxtjs

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000

# Production command
CMD ["node", ".output/server/index.mjs"]
