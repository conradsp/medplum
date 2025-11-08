# Multi-stage Dockerfile for Medplum EMR Application
# Stage 1: Build the application
FROM node:24-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code (including .env if it exists)
COPY . .

# Re-declare ARG here to make them available in this scope
ARG VITE_MEDPLUM_BASE_URL
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_MEDPLUM_CLIENT_ID

# Debug: Print ARG values to verify they're passed from docker-compose
RUN echo "=== ARG values from docker-compose ===" && \
    echo "ARG VITE_MEDPLUM_BASE_URL=${VITE_MEDPLUM_BASE_URL}" && \
    echo "ARG VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}" && \
    echo "ARG VITE_MEDPLUM_CLIENT_ID=${VITE_MEDPLUM_CLIENT_ID}" && \
    echo "======================================"

# Create .env file from build args to ensure Vite uses these values
RUN echo "Creating .env file with build args..." && \
    echo "VITE_MEDPLUM_BASE_URL=${VITE_MEDPLUM_BASE_URL}" > .env && \
    echo "VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}" >> .env && \
    echo "VITE_MEDPLUM_CLIENT_ID=${VITE_MEDPLUM_CLIENT_ID}" >> .env && \
    echo "Contents of .env file:" && \
    cat .env

# Build the application
RUN npx tsc && npx vite build

# Verify the build output contains the env vars
RUN echo "Checking if env vars are in built files..." && \
    grep -r "8103" dist/ || echo "WARNING: Base URL not found in dist!"

# Stage 2: Production image with nginx
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

