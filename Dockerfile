# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM node:22-bookworm-slim AS server-deps
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev

FROM node:22-bookworm-slim
ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_PATH=/data/overlay.db

WORKDIR /app/server
RUN mkdir -p /data /app/client/dist && chown -R node:node /data /app

COPY --from=server-deps --chown=node:node /app/server/node_modules ./node_modules
COPY --chown=node:node server/ ./
COPY --from=client-build --chown=node:node /app/client/dist ../client/dist

USER node
EXPOSE 3001

CMD ["npm", "start"]
