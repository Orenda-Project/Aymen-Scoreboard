FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install backend deps first (layer cache)
COPY backend/package*.json ./backend/
RUN cd backend && npm install --include=dev

# Copy and install frontend deps
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

# Copy source (node_modules excluded via .dockerignore)
COPY backend ./backend
COPY frontend ./frontend

# Generate Prisma client for Alpine Linux (musl)
RUN cd backend && npx prisma generate

# Build backend TypeScript
RUN cd backend && npm run build

# Build frontend
RUN cd frontend && VITE_API_BASE_URL=/api npm run build

ENV NODE_ENV=production

CMD ["node", "backend/dist/index.js"]
