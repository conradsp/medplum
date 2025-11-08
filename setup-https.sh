#!/bin/bash

# SSL Setup Script for Medplum EMR with HTTPS
# This script helps you obtain SSL certificates from Let's Encrypt

set -e

echo "=========================================="
echo "Medplum EMR HTTPS Setup"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  This script should be run as root or with sudo"
    echo "   Run: sudo ./setup-https.sh"
    exit 1
fi

# Get domain names
echo "Please enter your domain names:"
echo ""
read -p "API Domain (e.g., api.yourdomain.com): " API_DOMAIN
read -p "EMR App Domain (e.g., emr.yourdomain.com): " EMR_DOMAIN
read -p "Your email for Let's Encrypt notifications: " EMAIL

if [ -z "$API_DOMAIN" ] || [ -z "$EMR_DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "❌ Error: All fields are required"
    exit 1
fi

echo ""
echo "Configuration:"
echo "  API Domain: $API_DOMAIN"
echo "  EMR Domain: $EMR_DOMAIN"
echo "  Email: $EMAIL"
echo ""
read -p "Is this correct? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ]; then
    echo "Setup cancelled"
    exit 0
fi

# Update nginx configuration files
echo ""
echo "📝 Updating nginx configuration..."

sed -i "s/api\.yourdomain\.com/$API_DOMAIN/g" nginx/conf.d/medplum-api.conf
sed -i "s/emr\.yourdomain\.com/$EMR_DOMAIN/g" nginx/conf.d/emr-app.conf

# Create certbot directories
echo "📁 Creating certificate directories..."
mkdir -p certbot/conf
mkdir -p certbot/www

# Start nginx without SSL first (for ACME challenge)
echo ""
echo "🚀 Starting nginx for certificate validation..."

# Backup SSL configs temporarily
mv nginx/conf.d/medplum-api.conf nginx/conf.d/medplum-api.conf.ssl
mv nginx/conf.d/emr-app.conf nginx/conf.d/emr-app.conf.ssl

# Create temporary HTTP-only configs
cat > nginx/conf.d/medplum-api.conf << EOF
server {
    listen 80;
    server_name $API_DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 200 "OK";
        add_header Content-Type text/plain;
    }
}
EOF

cat > nginx/conf.d/emr-app.conf << EOF
server {
    listen 80;
    server_name $EMR_DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 200 "OK";
        add_header Content-Type text/plain;
    }
}
EOF

# Start nginx temporarily
docker-compose -f docker-compose-emr-https.yml up -d nginx-proxy

echo "⏳ Waiting for nginx to start..."
sleep 5

# Obtain certificates
echo ""
echo "🔐 Obtaining SSL certificates from Let's Encrypt..."
echo "   This may take a minute..."

docker-compose -f docker-compose-emr-https.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $API_DOMAIN

docker-compose -f docker-compose-emr-https.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $EMR_DOMAIN

# Restore SSL configs
echo ""
echo "📝 Restoring SSL configuration..."
mv nginx/conf.d/medplum-api.conf.ssl nginx/conf.d/medplum-api.conf
mv nginx/conf.d/emr-app.conf.ssl nginx/conf.d/emr-app.conf

# Update docker-compose environment
echo ""
echo "📝 Updating environment variables..."

export MEDPLUM_BASE_URL="https://$API_DOMAIN"
export MEDPLUM_SERVER_URL="https://$API_DOMAIN"
export MEDPLUM_APP_URL="https://$EMR_DOMAIN"

cat > .env.https << EOF
MEDPLUM_BASE_URL=https://$API_DOMAIN
MEDPLUM_SERVER_URL=https://$API_DOMAIN
MEDPLUM_APP_URL=https://$EMR_DOMAIN
EOF

echo "Environment file created: .env.https"
echo ""
echo "✅ SSL certificates obtained successfully!"
echo ""
echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo ""
echo "1. Load the environment variables:"
echo "   source .env.https"
echo ""
echo "2. Stop the temporary nginx:"
echo "   docker-compose -f docker-compose-emr-https.yml down"
echo ""
echo "3. Rebuild the EMR app with HTTPS URLs:"
echo "   docker-compose -f docker-compose-emr-https.yml build emr-app"
echo ""
echo "4. Start all services:"
echo "   docker-compose -f docker-compose-emr-https.yml up -d"
echo ""
echo "5. Access your EMR application:"
echo "   https://$EMR_DOMAIN"
echo ""
echo "Certificates will auto-renew every 12 hours via certbot."
echo "=========================================="
