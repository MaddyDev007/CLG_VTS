FROM node:20.19-alpine AS build

WORKDIR /app

ARG VITE_API_BASE_URL=/api
ARG VITE_WS_URL=/telemetry
ARG NODE_OPTIONS=--max-old-space-size=256

ENV CI=true \
    npm_config_update_notifier=false \
    NODE_OPTIONS=${NODE_OPTIONS} \
    VITE_API_BASE_URL=${VITE_API_BASE_URL} \
    VITE_WS_URL=${VITE_WS_URL}

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY index.html ./
COPY nginx.conf ./
COPY postcss.config.js ./
COPY tailwind.config.js ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY public ./public
COPY src ./src

RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
