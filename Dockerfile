FROM node:20-alpine AS base

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
# Ensures the COPY --from=build below always has a public/ to grab, even
# for apps in this monorepo-ish setup that don't ship one.
RUN mkdir -p public

FROM base AS development
COPY . .
EXPOSE 3052
CMD ["npm", "run", "dev"]

FROM base AS build
COPY . .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3052
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
EXPOSE 3052
CMD ["node", "server.js"]
