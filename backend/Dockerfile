FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN VITE_API_BASE_URL=/api npm run build

FROM python:3.11-slim
WORKDIR /app
COPY server.py .
COPY scoreboard.db* ./
COPY --from=frontend-builder /app/dist ./frontend/dist

ENV PORT=8080
EXPOSE 8080

CMD ["python", "server.py"]
