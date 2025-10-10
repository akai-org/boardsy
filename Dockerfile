FROM node:20-bullseye-slim AS deps
WORKDIR /app
# Install system deps needed by some native modules (sharp, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends build-essential python3 && rm -rf /var/lib/apt/lists/*

# Copy package manifests and install deps first so Docker layer cache helps on rebuilds
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts --no-audit --no-fund || npm install --no-audit --no-fund

FROM node:20-bullseye-slim AS base
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

FROM base AS dev
ENV NODE_ENV=development
EXPOSE 3000
CMD ["sh", "-c", "npm run dev"]

FROM base AS build
ENV NODE_ENV=production
RUN npm run build

FROM node:20-bullseye-slim AS prod
WORKDIR /app
COPY --from=build /app .
ENV NODE_ENV=production
EXPOSE 3000
CMD ["sh", "-c", "npm run start"]
