FROM oven/bun:1.3.4-alpine AS build

WORKDIR /app

COPY package.json ./
COPY src ./src
COPY tsconfig.json ./

RUN bun build --compile src/index.ts --outfile dist/telemetry-simulator

FROM alpine:3.20

WORKDIR /app

RUN apk add --no-cache ca-certificates

COPY --from=build /app/dist/telemetry-simulator ./telemetry-simulator

CMD ["./telemetry-simulator"]
