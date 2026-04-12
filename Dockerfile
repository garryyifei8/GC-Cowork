# syntax=docker/dockerfile:1.7
FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build
COPY requirements.txt .
RUN pip install --prefix=/install --no-warn-script-location -r requirements.txt

ENV FASTEMBED_CACHE=/opt/fastembed_cache
RUN PYTHONPATH=/install/lib/python3.11/site-packages \
    python -c "from fastembed import TextEmbedding; TextEmbedding(model_name='BAAI/bge-small-zh-v1.5', cache_dir='${FASTEMBED_CACHE}')"

FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    FASTEMBED_CACHE=/opt/fastembed_cache \
    VECTOR_DB_BACKEND=pgvector

RUN apt-get update && apt-get install -y --no-install-recommends \
        libgomp1 \
        libpq5 \
        curl \
        tini \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd -r app && useradd -r -g app -d /app -s /sbin/nologin app

WORKDIR /app

COPY --from=builder /install /usr/local
COPY --from=builder /opt/fastembed_cache /opt/fastembed_cache

COPY --chown=app:app src/ ./src/
COPY --chown=app:app supabase/ ./supabase/
COPY --chown=app:app scripts/ ./scripts/

USER app

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -fsS http://localhost:8000/health || exit 1

ENTRYPOINT ["tini", "--"]
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
