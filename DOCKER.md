# Docker Deployment Guide

This document provides detailed information about Docker deployment for Portal da Lembrança.

## Quick Start

### Using Make (Recommended)

```bash
# Build and run in one command
make run

# View logs
make logs

# Stop container
make stop
```

### Using Docker Commands Directly

```bash
# Build the image
docker build -t portaldalembranca-next .

# Run the container
docker run -d \
  --name portaldalembranca-app \
  -p 3000:3000 \
  --env-file .env \
  portaldalembranca-next

# View logs
docker logs -f portaldalembranca-app

# Stop and remove
docker stop portaldalembranca-app
docker rm portaldalembranca-app
```

## Multi-Stage Build Architecture

The Dockerfile uses a 4-stage build process:

### Stage 1: Base
- Uses `node:20-alpine` for minimal size
- Enables pnpm via corepack
- Sets up PATH for pnpm

### Stage 2: Dependencies
- Installs all dependencies from `pnpm-lock.yaml`
- Uses pnpm store caching for faster builds
- Frozen lockfile ensures reproducible builds

### Stage 3: Builder
- Copies dependencies from stage 2
- Copies source code
- Runs `pnpm build` to create production build
- Generates standalone output (configured in `next.config.js`)

### Stage 4: Runner (Final)
- Minimal runtime image
- Creates non-root user (nextjs:1001) for security
- Copies only necessary files:
  - Public assets
  - Standalone build output
  - Static files
- Exposes port 3000
- Includes health check

## Environment Variables

### Required Variables

```bash
DATABASE_URL="postgresql://user:pass@host:5432/db"
JWT_SECRET="your-256-bit-secret-key-here"
NODE_ENV="production"
```

### Optional Variables

```bash
# AWS S3 for file uploads
AWS_ACCESS_KEY_ID="your-key"
AWS_SECRET_ACCESS_KEY="your-secret"
AWS_S3_BUCKET="your-bucket"
AWS_REGION="us-east-1"

# Application URL
NEXT_PUBLIC_APP_URL="https://yourdomain.com"

# OAuth (if using external auth)
OAUTH_SERVER_URL=""
OWNER_OPEN_ID=""

# Stripe (future feature)
STRIPE_SECRET_KEY=""
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""
```

### Passing Environment Variables

**Option 1: Using .env file** (Recommended)
```bash
docker run -d --env-file .env portaldalembranca-next
```

**Option 2: Individual variables**
```bash
docker run -d \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  -e NODE_ENV="production" \
  portaldalembranca-next
```

**Option 3: Build-time arguments**
```bash
docker build \
  --build-arg DATABASE_URL="postgresql://..." \
  --build-arg JWT_SECRET="..." \
  -t portaldalembranca-next .
```

## Docker Compose (Optional)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: portal_lembranca
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Run with:
```bash
docker-compose up -d
```

## Production Deployment

### Cloud Platforms

**Vercel (Recommended)**:
- No Docker needed, native Next.js support
- Automatic deployments from Git
- Set environment variables in dashboard

**AWS ECS/Fargate**:
```bash
# Build for ARM64 (Graviton)
docker buildx build --platform linux/arm64 -t portaldalembranca-next .

# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
docker tag portaldalembranca-next:latest <account>.dkr.ecr.us-east-1.amazonaws.com/portaldalembranca-next:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/portaldalembranca-next:latest
```

**Railway**:
- Detects Dockerfile automatically
- Set environment variables in dashboard
- Auto-deploy from Git

**DigitalOcean App Platform**:
- Use Dockerfile deploy method
- Configure environment variables
- Enable auto-deploy

## Optimization Tips

### Build Cache

Use BuildKit for better caching:
```bash
DOCKER_BUILDKIT=1 docker build -t portaldalembranca-next .
```

### Multi-Architecture Builds

Build for both AMD64 and ARM64:
```bash
docker buildx build --platform linux/amd64,linux/arm64 -t portaldalembranca-next .
```

### Image Size

Current image size: ~150MB (alpine-based)

To verify:
```bash
docker images portaldalembranca-next
```

### Health Checks

The container includes automatic health checks:
- Interval: 30s
- Timeout: 3s
- Start period: 40s
- Retries: 3

Check health status:
```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

## Troubleshooting

### Container Won't Start

Check logs:
```bash
docker logs portaldalembranca-app
```

Common issues:
- Missing environment variables
- Database connection failed
- Port 3000 already in use

### Database Connection Issues

Test database connection from container:
```bash
docker exec -it portaldalembranca-app sh
node -e "const postgres = require('postgres'); const sql = postgres(process.env.DATABASE_URL); sql\`SELECT 1\`.then(console.log).catch(console.error).finally(() => process.exit())"
```

### Build Failures

Clear Docker cache:
```bash
docker builder prune -a
```

Rebuild without cache:
```bash
docker build --no-cache -t portaldalembranca-next .
```

### Permission Issues

If you get permission errors, ensure the app runs as non-root user (it should by default).

## Security Best Practices

✅ **Implemented**:
- Non-root user (nextjs:1001)
- Minimal base image (alpine)
- No secrets in Dockerfile
- Health checks enabled
- Standalone build (minimal dependencies)

⚠️ **Recommended**:
- Use secrets management (AWS Secrets Manager, HashiCorp Vault)
- Enable read-only filesystem: `docker run --read-only`
- Scan images: `docker scan portaldalembranca-next`
- Use specific tags, not `latest`
- Keep base image updated

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Docker Build

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: docker build -t portaldalembranca-next .
      - name: Run tests in container
        run: docker run portaldalembranca-next pnpm test:run
```

## Monitoring

### Container Stats

```bash
docker stats portaldalembranca-app
```

### Resource Limits

Set CPU and memory limits:
```bash
docker run -d \
  --cpus="1.0" \
  --memory="512m" \
  --name portaldalembranca-app \
  portaldalembranca-next
```

## Additional Resources

- [Next.js Docker Documentation](https://nextjs.org/docs/deployment#docker-image)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
