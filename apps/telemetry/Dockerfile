FROM oven/bun:1.3.4-alpine

WORKDIR /app

RUN apk add --no-cache ca-certificates

COPY package.json ./
COPY tsconfig.json ./
COPY src ./src

CMD ["bun", "run", "src/index.ts"]
