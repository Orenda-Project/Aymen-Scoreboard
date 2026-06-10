FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install backend deps (including devDependencies needed for build)
COPY backend/package*.json ./backend/
RUN cd backend && npm install --include=dev

# Copy backend source (node_modules excluded via .dockerignore)
COPY backend ./backend

# Generate Prisma client for Debian (openssl 3.x)
RUN cd backend && npx prisma generate

# Build backend TypeScript
RUN cd backend && npm run build

# The UI is a single self-contained HTML file served by the backend at /
COPY DEMO.html ./DEMO.html

ENV NODE_ENV=production

CMD ["node", "backend/dist/index.js"]
