FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main.js"]

# #for public release
# FROM node:20-alpine

# WORKDIR /app

# COPY package*.json ./

# # Install ALL deps (including dev)
# RUN npm install

# COPY . .

# # Build project
# RUN npm run build

# # Remove dev dependencies (optional optimization)
# RUN npm prune --omit=dev

# EXPOSE 3000

# CMD ["node", "dist/main.js"]