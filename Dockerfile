# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app/packages/web

COPY packages/web/package.json ./
COPY packages/web/tsconfig.json ./
COPY packages/web/vite.config.ts ./
COPY packages/web/postcss.config.js ./
COPY packages/web/tailwind.config.js ./
COPY packages/web/index.html ./
COPY packages/web/public ./public
COPY packages/web/src ./src

RUN npm install
RUN npm run build

# ---- Runtime Stage ----
FROM node:20-alpine AS runner

WORKDIR /app

# Copy only the built output and static assets from builder
COPY --from=builder /app/packages/web/dist ./dist
COPY --from=builder /app/packages/web/public ./public
COPY --from=builder /app/packages/web/package.json ./package.json
COPY --from=builder /app/packages/web/package-lock.json ./package-lock.json

EXPOSE 5173

CMD ["npx", "serve", "-s", "dist", "-l", "5173"]
