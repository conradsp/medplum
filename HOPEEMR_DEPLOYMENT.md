# HopeEMR Deployment Guide

Complete guide for deploying Medplum EMR to hopeemr.com with HTTPS.

## Architecture Overview

- **hopeemr.com** (HTTPS) → Nginx Proxy → EMR App (Vite dev server on port 3000)
- **api.hopeemr.com** (HTTPS) → Nginx Proxy → Medplum Server (port 8103)
- **PostgreSQL** → Database (port 5432)
- **Redis** → Cache (port 6379)

## Prerequisites

1. **Domain DNS Configuration**
   ```
   A Record: hopeemr.com      → YOUR_SERVER_IP
   A Record: www.hopeemr.com  → YOUR_SERVER_IP
   A Record: api.hopeemr.com  → YOUR_SERVER_IP
   ```

2. **Server Requirements**
   - Ubuntu 20.04 or later
   - Docker and Docker Compose installed
   - Ports 80, 443 open in firewall

3. **Firewall Setup**
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow 22/tcp
   sudo ufw enable
   ```

## Quick Deployment (Step by Step)

### Step 1: Clone and Navigate to Project

```bash
cd /home/steveconrad/medplum
```

### Step 2: Update DNS

Ensure your DNS records are pointing to your server:

```bash
# Verify DNS is working
dig hopeemr.com +short
dig api.hopeemr.com +short
# Both should return your server's IP address
```

### Step 3: Set Environment Variables

```bash
export MEDPLUM_BASE_URL=https://api.hopeemr.com
export MEDPLUM_SERVER_URL=https://api.hopeemr.com
export MEDPLUM_APP_URL=https://hopeemr.com
```

Save these to a file for persistence:

```bash
cat > .env.hopeemr << EOF
MEDPLUM_BASE_URL=https://api.hopeemr.com
MEDPLUM_SERVER_URL=https://api.hopeemr.com
MEDPLUM_APP_URL=https://hopeemr.com
EOF

source .env.hopeemr
```

### Step 4: Obtain SSL Certificates

First, start nginx temporarily for ACME challenge:

```bash
# Create certificate directories
mkdir -p certbot/conf
mkdir -p certbot/www

# Start nginx temporarily (HTTP only for certificate validation)
docker compose -f docker-compose-emr.yml up -d nginx-proxy

# Wait a few seconds for nginx to start
sleep 5

# Obtain certificate for api.hopeemr.com
docker compose -f docker-compose-emr.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email sconrad3@gmail.com \
    --agree-tos \
    --no-eff-email \
    -d api.hopeemr.com

# Obtain certificate for hopeemr.com (including www subdomain)
docker compose -f docker-compose-emr.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email sconrad3@gmail.com \
    --agree-tos \
    --no-eff-email \
    -d hopeemr.com
```

### Step 5: Stop Temporary Nginx

```bash
docker compose -f docker-compose-emr.yml down
```

### Step 6: Build and Start All Services

```bash
# Build the EMR app with HTTPS URLs
docker compose -f docker-compose-emr.yml build emr-app

# Start all services
docker compose -f docker-compose-emr.yml up -d

# Watch logs
docker compose -f docker-compose-emr.yml logs -f
```

### Step 7: Verify Deployment

```bash
# Check all containers are running and healthy
docker-compose -f docker-compose-emr-https.yml ps

# Test the API
curl https://api.hopeemr.com/healthcheck

# Test the EMR app
curl -I https://hopeemr.com
```

### Step 8: Access the Application

Open your browser and navigate to:
- **https://hopeemr.com** - EMR Application
- **https://api.hopeemr.com/healthcheck** - API Health Check

## Configuration Files

### Key Files Updated:
- `docker-compose-emr-https.yml` - Main orchestration file
- `nginx/conf.d/emr-app.conf` - EMR app reverse proxy config
- `nginx/conf.d/medplum-api.conf` - API reverse proxy config
- `examples/emr/Dockerfile` - EMR app Dockerfile (runs Vite dev server)

## Architecture Details

### EMR Application Container
- **Base Image**: node:24-slim
- **Port**: 3000 (internal)
- **Server**: Vite dev server
- **Environment**: Development mode with HMR (Hot Module Replacement)

### Nginx Reverse Proxy
- **Port 80**: HTTP → Redirects to HTTPS
- **Port 443**: HTTPS → Proxies to backend services
- **SSL**: Let's Encrypt certificates (auto-renewal every 12 hours)

### Medplum Server
- **Port**: 8103 (internal)
- **Database**: PostgreSQL 16
- **Cache**: Redis 7

## Troubleshooting

### Certificate Issues

If certificate generation fails:

```bash
# Check DNS resolution
dig hopeemr.com +short
dig api.hopeemr.com +short

# Check if nginx is accessible from internet
curl http://YOUR_SERVER_IP/.well-known/acme-challenge/test

# Check nginx logs
docker-compose -f docker-compose-emr-https.yml logs nginx-proxy

# Try obtaining certificates manually
docker-compose -f docker-compose-emr-https.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email your-email@example.com \
    --agree-tos \
    --dry-run \
    -d hopeemr.com
```

### EMR App Not Starting

```bash
# Check EMR app logs
docker-compose -f docker-compose-emr-https.yml logs emr-app

# Check if Vite server is running
docker-compose -f docker-compose-emr-https.yml exec emr-app ps aux | grep node

# Test directly
docker-compose -f docker-compose-emr-https.yml exec emr-app wget -O- http://localhost:3000/
```

### Nginx Errors

```bash
# Test nginx configuration
docker-compose -f docker-compose-emr-https.yml exec nginx-proxy nginx -t

# Reload nginx
docker-compose -f docker-compose-emr-https.yml exec nginx-proxy nginx -s reload

# Check nginx error logs
docker-compose -f docker-compose-emr-https.yml exec nginx-proxy tail -50 /var/log/nginx/error.log
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose -f docker-compose-emr-https.yml exec postgres pg_isready -U medplum

# Check Redis is running
docker-compose -f docker-compose-emr-https.yml exec redis redis-cli -a medplum ping
```

## Updating the Application

### To update EMR app code:

```bash
cd /home/steveconrad/medplum

# Pull latest changes (if using git)
git pull

# Rebuild EMR app
docker-compose -f docker-compose-emr-https.yml build emr-app

# Restart the container
docker-compose -f docker-compose-emr-https.yml up -d emr-app
```

### To update Medplum server:

```bash
# Pull latest image
docker pull medplum/medplum-server:latest

# Restart server
docker-compose -f docker-compose-emr-https.yml up -d medplum-server
```

## Certificate Renewal

Certificates are automatically renewed by the certbot container every 12 hours.

To manually renew:

```bash
docker-compose -f docker-compose-emr-https.yml run --rm certbot renew
docker-compose -f docker-compose-emr-https.yml exec nginx-proxy nginx -s reload
```

## Backup and Restore

### Backup Database

```bash
# Backup PostgreSQL
docker-compose -f docker-compose-emr-https.yml exec postgres pg_dump -U medplum medplum > backup_$(date +%Y%m%d).sql

# Backup volumes
docker run --rm \
  -v medplum_postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres_backup_$(date +%Y%m%d).tar.gz /data
```

### Restore Database

```bash
# Restore PostgreSQL
cat backup_20250108.sql | docker-compose -f docker-compose-emr-https.yml exec -T postgres psql -U medplum medplum
```

## Performance Optimization

### For Production Use

Consider switching from Vite dev server to a production build:

1. Update `examples/emr/Dockerfile` to build static assets
2. Serve with nginx instead of Vite dev server
3. Enable nginx caching for static assets

See `examples/emr/Dockerfile.production` for production-ready configuration.

## Security Checklist

- [ ] SSL certificates installed and working
- [ ] Firewall configured (only ports 80, 443, 22 open)
- [ ] Strong PostgreSQL password set
- [ ] Strong Redis password set
- [ ] Regular backups configured
- [ ] Monitoring and alerting set up
- [ ] SSL certificates auto-renewal tested

## Support

For issues:
1. Check logs: `docker-compose -f docker-compose-emr-https.yml logs`
2. Check container status: `docker-compose -f docker-compose-emr-https.yml ps`
3. Review Medplum docs: https://www.medplum.com/docs
