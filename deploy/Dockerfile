# DukaanOS Production Multi-Stage Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and workspace package files
COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY mcp/package.json ./mcp/
COPY client/package.json ./client/

# Install all dependencies
RUN npm ci
RUN npm --prefix server ci
RUN npm --prefix mcp ci
RUN npm --prefix client ci

# Copy full source
COPY . .

# Build all packages (Server, MCP, Client)
RUN npm run build

# Production Runner Stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
ENV MCP_PORT=4001

# Copy root package files
COPY package.json package-lock.json ./

# Copy compiled outputs and node_modules
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/server/package.json ./server/package.json
COPY --from=builder /app/server/data ./server/data

COPY --from=builder /app/mcp/dist ./mcp/dist
COPY --from=builder /app/mcp/node_modules ./mcp/node_modules
COPY --from=builder /app/mcp/package.json ./mcp/package.json

COPY --from=builder /app/client/dist ./client/dist

# Expose API/Web (4000) and MCP SSE (4001)
EXPOSE 4000 4001

# Start both DukaanOS Backend & MCP Server
CMD ["npm", "run", "start:all"]

