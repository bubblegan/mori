FROM node:20-alpine AS base

FROM base AS builder

RUN apk update
RUN apk add --no-cache libc6-compat

WORKDIR /app

RUN npm install turbo --global
COPY . .
RUN turbo prune background-job --docker

FROM base AS installer

RUN apk update
RUN apk add --no-cache gcompat libc6-compat

WORKDIR /app

# First install dependencies (as they change less often)
COPY --from=builder /app/out/json/ .
RUN npm install

# Build the project and its dependencies
COPY --from=builder /app/out/full/ .

RUN npx turbo build --filter=background-job...

FROM base AS runner
RUN apk add --no-cache graphicsmagick ghostscript 
WORKDIR /app

RUN addgroup --system --gid 1001 hono
RUN adduser --system --uid 1001 hono
USER hono

COPY --from=installer /app .

EXPOSE 3001

CMD node apps/background-job/dist/index.js