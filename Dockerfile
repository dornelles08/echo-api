FROM node:22-alpine AS build

RUN corepack enable \
    && apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:22-alpine AS runtime

RUN corepack enable \
    && apk add --no-cache ffmpeg

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/package.json /app/pnpm-lock.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 3333

CMD ["node", "dist/server.js"]
