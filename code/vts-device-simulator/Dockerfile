FROM node:20.19-alpine AS build

WORKDIR /app

ARG VITE_DEVICE_SIMULATOR_URL=
ARG VITE_MQTT_TOPIC_PREFIX=vts
ARG NODE_OPTIONS=--max-old-space-size=256

ENV CI=true \
    npm_config_update_notifier=false \
    NODE_OPTIONS=${NODE_OPTIONS} \
    VITE_DEVICE_SIMULATOR_URL=${VITE_DEVICE_SIMULATOR_URL} \
    VITE_MQTT_TOPIC_PREFIX=${VITE_MQTT_TOPIC_PREFIX}

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY index.html ./
COPY postcss.config.js ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY public ./public
COPY server ./server
COPY src ./src

RUN npm run build && npm prune --omit=dev

FROM node:20.19-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-server ./dist-server

EXPOSE 3011

CMD ["node", "dist-server/index.js"]
