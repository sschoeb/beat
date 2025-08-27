# Multi-stage build for production

# Stage 1: Build backend
FROM node:18-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npm run build

# Stage 2: Build frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/table-match-frontend/package*.json ./
RUN npm ci
COPY frontend/table-match-frontend ./
RUN npm run build:prod

# Stage 3: Production image
FROM node:18-alpine
WORKDIR /app

# Install PM2 globally
RUN npm install -g pm2

# Copy backend build and dependencies
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY backend/package*.json ./backend/

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist/table-match-frontend ./frontend

# Copy configuration files
COPY ecosystem.config.js ./
COPY .env.production ./

# Install nginx for serving frontend
RUN apk add --no-cache nginx

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create log directory
RUN mkdir -p /app/logs

# Expose ports
EXPOSE 80 3001

# Start both nginx and PM2
CMD nginx && pm2-runtime start ecosystem.config.js --env production