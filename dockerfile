FROM node:24-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM node:24-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

RUN npm prune --production

FROM node:24-alpine AS production
WORKDIR /app

ENV NODE_ENV=development
ENV PORT=3000

USER node

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Executa a aplicação compilada em JavaScript
CMD ["node", "dist/infra/main.js"]