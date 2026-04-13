FROM node:20.19-alpine AS build

WORKDIR /app

ENV CI=true \
    npm_config_update_notifier=false

COPY package*.json ./
RUN npm ci

COPY nest-cli.json tsconfig.json ./
COPY src ./src

RUN npm run build && npm prune --omit=dev

FROM node:20.19-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]
