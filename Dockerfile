FROM node:20-alpine

WORKDIR /app

# Install backend deps (including devDependencies needed for build)
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Install frontend deps
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

# Copy all source
COPY backend ./backend
COPY frontend ./frontend

# Generate Prisma client (uses musl binary for Alpine)
RUN cd backend && npx prisma generate

# Build backend TypeScript
RUN cd backend && npm run build

# Build frontend (API calls go to same origin /api)
RUN cd frontend && VITE_API_BASE_URL=/api npm run build

ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "backend/dist/index.js"]
