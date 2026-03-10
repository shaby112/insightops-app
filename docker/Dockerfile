# ============================================
# Stage 1: Build Frontend
# ============================================
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
ARG VITE_CLERK_PUBLISHABLE_KEY=""
ENV VITE_CLERK_PUBLISHABLE_KEY=${VITE_CLERK_PUBLISHABLE_KEY}
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --production=false
COPY frontend/ ./
RUN npm run build

# ============================================
# Stage 2: Build Backend Dependencies
# ============================================
FROM python:3.11-slim AS backend-deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ libpq-dev curl && rm -rf /var/lib/apt/lists/*
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ============================================
# Stage 3: Production Runtime
# ============================================
FROM python:3.11-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx libpq5 curl && rm -rf /var/lib/apt/lists/*

# Security baseline: application user for backend process.
RUN groupadd -r kuantra && useradd -r -g kuantra -m kuantra

COPY --from=backend-deps /install /usr/local

WORKDIR /app
COPY backend/ ./backend/
COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

RUN mkdir -p /app/data /app/data/uploads /app/data/ssh_keys /app/data/duckdb_temp \
    && chown -R kuantra:kuantra /app/data /app/backend

ENV PYTHONPATH=/app/backend \
    DUCKDB_DATABASE_PATH=/app/data/warehouse.duckdb \
    UPLOAD_DIR=/app/data/uploads \
    SSH_KEY_DIR=/app/data/ssh_keys \
    DUCKDB_TEMP_DIR=/app/data/duckdb_temp \
    PORT=8000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

EXPOSE 8080 8000

COPY docker/start.sh /app/start.sh
RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]
