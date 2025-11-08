# HTTPS Setup for Medplum EMR

This guide will help you set up SSL/TLS certificates for your Medplum EMR deployment using Let's Encrypt.

## Prerequisites

1. **Domain Names**: You need two domain names pointing to your server:
   - `api.yourdomain.com` - For the Medplum API server
   - `emr.yourdomain.com` - For the EMR frontend application

2. **DNS Configuration**: Make sure both domains have A records pointing to your server's public IP address:
   ```
   api.yourdomain.com  A  YOUR_SERVER_IP
   emr.yourdomain.com  A  YOUR_SERVER_IP
   ```

3. **Firewall**: Ensure ports 80 and 443 are open:
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw reload
   ```

## Quick Setup (Automated)

### Option 1: Using the setup script

1. Copy all files to your Ubuntu server:
   ```bash
   cd /home/steveconrad/medplum
   ```

2. Make the setup script executable:
   ```bash
   chmod +x setup-https.sh
   ```

3. Run the setup script:
   ```bash
   sudo ./setup-https.sh
   ```

4. Follow the prompts to enter your domain names and email.

5. After the script completes, follow the displayed instructions to start your services.

## Manual Setup

If you prefer to set up manually or troubleshoot:

### Step 1: Update Configuration Files

1. Edit `nginx/conf.d/medplum-api.conf`:
   - Replace `api.yourdomain.com` with your actual API domain

2. Edit `nginx/conf.d/emr-app.conf`:
   - Replace `emr.yourdomain.com` with your actual EMR domain

### Step 2: Create Certificate Directories

```bash
mkdir -p certbot/conf
mkdir -p certbot/www
```

### Step 3: Obtain SSL Certificates

First, start nginx to handle the ACME challenge:

```bash
# Temporarily modify nginx configs to only listen on port 80
docker-compose -f docker-compose-emr-https.yml up -d nginx-proxy
```

Then obtain certificates:

```bash
# For API domain
docker-compose -f docker-compose-emr-https.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email your-email@example.com \
    --agree-tos \
    --no-eff-email \
    -d api.yourdomain.com

# For EMR domain
docker-compose -f docker-compose-emr-https.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email your-email@example.com \
    --agree-tos \
    --no-eff-email \
    -d emr.yourdomain.com
```

### Step 4: Set Environment Variables

```bash
export MEDPLUM_BASE_URL=https://api.yourdomain.com
export MEDPLUM_SERVER_URL=https://api.yourdomain.com
export MEDPLUM_APP_URL=https://emr.yourdomain.com
```

### Step 5: Build and Start Services

```bash
# Stop temporary nginx
docker-compose -f docker-compose-emr-https.yml down

# Build EMR app with HTTPS URLs
docker-compose -f docker-compose-emr-https.yml build emr-app

# Start all services
docker-compose -f docker-compose-emr-https.yml up -d
```

### Step 6: Verify

1. Visit `https://emr.yourdomain.com` in your browser
2. Check that the SSL certificate is valid (lock icon in address bar)
3. Try logging in - it should work without crypto errors!

## Troubleshooting

### Certificate Not Found

If you get errors about missing certificates:

```bash
# Check certificate files
sudo ls -la certbot/conf/live/

# If empty, run certbot again
docker-compose -f docker-compose-emr-https.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email your-email@example.com \
    --agree-tos \
    -d your-domain.com
```

### DNS Not Resolving

Make sure your DNS records are propagated:

```bash
# Check DNS resolution
dig api.yourdomain.com
dig emr.yourdomain.com

# Or use
nslookup api.yourdomain.com
```

### Port 80 or 443 Already in Use

Check what's using the ports:

```bash
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443

# Stop conflicting services
sudo systemctl stop apache2  # if Apache is running
sudo systemctl stop nginx    # if system nginx is running
```

### Certificate Renewal

Certificates automatically renew every 12 hours. To manually renew:

```bash
docker-compose -f docker-compose-emr-https.yml run --rm certbot renew
docker-compose -f docker-compose-emr-https.yml exec nginx-proxy nginx -s reload
```

## Testing Without a Domain (Development Only)

If you don't have a domain name yet, you can use **self-signed certificates** for testing:

### Generate Self-Signed Certificates

```bash
mkdir -p certbot/conf/live/api.yourdomain.com
mkdir -p certbot/conf/live/emr.yourdomain.com

# API certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout certbot/conf/live/api.yourdomain.com/privkey.pem \
    -out certbot/conf/live/api.yourdomain.com/fullchain.pem \
    -subj "/CN=api.yourdomain.com"

# EMR certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout certbot/conf/live/emr.yourdomain.com/privkey.pem \
    -out certbot/conf/live/emr.yourdomain.com/fullchain.pem \
    -subj "/CN=emr.yourdomain.com"
```

Then update your `/etc/hosts` file to point the domains to localhost:

```bash
sudo nano /etc/hosts

# Add these lines:
127.0.0.1  api.yourdomain.com
127.0.0.1  emr.yourdomain.com
```

**Note**: Your browser will show a security warning for self-signed certificates. You'll need to accept the risk to proceed.

## Alternative: Using Cloudflare Tunnel

If you don't want to expose your server directly, you can use Cloudflare Tunnel (free):

1. Sign up for Cloudflare and add your domain
2. Install cloudflared on your server
3. Create a tunnel pointing to your local services
4. Cloudflare will handle SSL/TLS automatically

See: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/

## Files Created

- `docker-compose-emr-https.yml` - Docker Compose with HTTPS support
- `nginx/nginx.conf` - Main nginx configuration
- `nginx/conf.d/medplum-api.conf` - API server proxy config
- `nginx/conf.d/emr-app.conf` - EMR app proxy config
- `setup-https.sh` - Automated setup script
- `HTTPS_SETUP.md` - This file

## Security Notes

1. **Keep certificates updated**: Certbot auto-renews, but monitor the logs
2. **Use strong passwords**: Change default PostgreSQL/Redis passwords
3. **Firewall**: Only expose ports 80, 443, and SSH
4. **Regular updates**: Keep Docker images updated
5. **Backup**: Regularly backup your database and certificates

## Support

For issues with:
- **Let's Encrypt**: https://letsencrypt.org/docs/
- **Nginx**: https://nginx.org/en/docs/
- **Medplum**: https://www.medplum.com/docs
