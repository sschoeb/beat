# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /build

# Copy build script and package files
COPY build.js package*.json ./
COPY table-match-manager/ ./table-match-manager/

# Install Node.js for build script
RUN npm install

# Run the build script
RUN node build.js

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install nginx and supervisor for process management
RUN apk add --no-cache nginx supervisor

# Copy built files from builder stage
COPY --from=builder /build/dist/frontend /usr/share/nginx/html
COPY --from=builder /build/dist/backend /app/backend
COPY --from=builder /build/dist/db /app/db

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Install production dependencies for backend
WORKDIR /app/backend
RUN npm ci --production

# Create supervisor configuration
RUN mkdir -p /etc/supervisor.d
COPY supervisord.conf /etc/supervisor.d/supervisord.ini

# Create necessary directories
RUN mkdir -p /var/log/supervisor /run/nginx

# Expose ports
EXPOSE 80 3001

# Start supervisor to manage both nginx and node
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]