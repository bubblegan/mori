FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS builder
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Install dependencies based on the preferred package manager
RUN npm install turbo --global
COPY . .
RUN npx turbo prune web --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer

RUN apk update
RUN apk add --no-cache libc6-compat
RUN apk add --update python3 make g++\
   && rm -rf /var/cache/apk/*
RUN apk add --update --no-cache \
    make \
    g++ \
    jpeg-dev \
    cairo-dev \
    giflib-dev \
    pango-dev \
    libtool \
    autoconf \
    automake


WORKDIR /app

# First install the dependencies (as they change less often)
COPY --from=builder /app/out/json/ .
RUN npm install

# Build the project
COPY --from=builder /app/out/full/ .

RUN npx turbo build --filter=web...

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing

# COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
# COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
# COPY --from=installer --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

# COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
# COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static


# Set the correct permission for prerender cache
# RUN mkdir .next
# RUN chown nextjs:nodejs .next

COPY --from=installer --chown=nextjs:nodejs /app/apps/web/public ./public
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
ENV HOSTNAME="0.0.0.0"


# CMD ["node", "server.js"]

CMD ["sh", "-c", "ls ."]

# CMD node apps/web/server.js