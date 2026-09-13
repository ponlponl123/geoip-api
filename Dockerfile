# Stage 1: Build standalone compiled binary
FROM oven/bun:1-alpine AS builder
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY src ./src
COPY tsconfig.json* ./

RUN bun build src/index.ts --compile --minify --outfile /app/server

# Stage 2: Ultra-lightweight runner
FROM alpine:3.20 AS runner
WORKDIR /app

RUN apk add --no-cache ca-certificates libstdc++ libgcc tzdata && \
    addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder --chown=appuser:appgroup /app/server ./server

USER appuser

EXPOSE 4002
ENV PORT=4002 \
    NODE_ENV=production

ENTRYPOINT ["./server"]
