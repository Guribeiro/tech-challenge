FROM node:24-alpine AS deps
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
RUN npx prisma generate

FROM node:24-alpine AS development
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]

FROM node:24-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build
RUN npm prune --production

FROM node:24-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

USER node

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/src/teste/helpers ./src/teste/helpers
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/newrelic.cjs ./

EXPOSE 3000

ENV NEW_RELIC_APP_NAME=oficina-app \
    NEW_RELIC_HOME=/app

# Executa a aplicação compilada com o agente New Relic pré-carregado (ESM).
# Sem NEW_RELIC_LICENSE_KEY o agente permanece desativado.
CMD ["node", "--import", "newrelic/esm-loader.mjs", "-r", "newrelic", "dist/infra/main.js"]