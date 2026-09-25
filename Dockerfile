# ==============================================================================
# VKRM Panel - Multi-Stage Production Dockerfile for Coolify (45.194.47.203)
# Stage 1: Build TypeScript + React + Tailwind v4 SPA
# Stage 2: Ultra-slim Nginx Alpine serving static bundle + /healthz
# ==============================================================================

FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production Runtime
FROM nginx:1.27-alpine AS runtime

RUN apk add --no-cache curl

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -fsS http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
