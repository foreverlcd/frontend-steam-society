# syntax=docker/dockerfile:1
# NEXT_PUBLIC_API_URL es pública: Next la incrusta en el bundle durante el build.
# Pásala con --build-arg; cambiarla exige reconstruir la imagen.

FROM node:24.22.1-alpine AS build
WORKDIR /app
# pnpm pinned to the version that produced pnpm-lock.yaml.
RUN npm install -g pnpm@12.15.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ARG NEXT_PUBLIC_API_URL=http://localhost:3000/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
# `public` es opcional en el repo; se garantiza para el COPY del runtime.
RUN mkdir -p public && pnpm build

FROM node:24.22.1-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3001 \
    HOSTNAME=0.0.0.0
RUN addgroup -S -g 1001 app && adduser -S -u 1001 -G app app
COPY --from=build --chown=app:app /app/public ./public
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
USER app
EXPOSE 3001
CMD ["node", "server.js"]
