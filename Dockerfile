FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./
COPY src ./src

RUN npm ci
RUN npm run build:server

FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

COPY data ./data

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s CMD node -e "fetch('http://localhost:'+(process.env.MCP_PORT||process.env.PORT||3000)+'/healthz').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "dist/mcp/server.js"]
