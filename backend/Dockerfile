# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
# Use a slim Python base and install dependencies into an isolated layer.
FROM python:3.11-slim AS builder

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /build

# Copy only requirements first to leverage Docker layer caching
COPY requirements.txt .

# Install dependencies into a target directory for the final stage copy
RUN pip install --upgrade pip && \
    pip install --no-cache-dir --prefix=/install -r requirements.txt


# ─── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=5000

# Create a non-root user for security best practices
RUN addgroup --system appgroup && \
    adduser --system --ingroup appgroup appuser

WORKDIR /app

# Copy installed packages from builder stage
COPY --from=builder /install /usr/local

# Copy application source
COPY app.py .

# Transfer ownership to non-root user
RUN chown -R appuser:appgroup /app

USER appuser

# Expose the API port
EXPOSE 5000

# Health check for container orchestrators (Kubernetes, ECS, etc.)
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/api/health')" || exit 1

# Start with Gunicorn in production (4 workers × 2 threads = 8 concurrent requests)
CMD ["gunicorn", \
     "--bind", "0.0.0.0:5000", \
     "--workers", "4", \
     "--threads", "2", \
     "--timeout", "120", \
     "--access-logfile", "-", \
     "--error-logfile", "-", \
     "app:app"]
