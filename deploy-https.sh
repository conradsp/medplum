#!/bin/bash

# Quick Deployment Script for Medplum EMR with HTTPS
# Run this on your Ubuntu server after setting up SSL certificates

set -e

echo "=========================================="
echo "Medplum EMR HTTPS Deployment"
echo "=========================================="
echo ""

# Check for environment file
if [ ! -f ".env.https" ]; then
    echo "❌ Error: .env.https file not found"
    echo "   Please run setup-https.sh first to obtain SSL certificates"
    exit 1
fi

# Load environment variables
echo "📝 Loading environment variables..."
source .env.https

echo "Configuration:"
echo "  API URL: $MEDPLUM_BASE_URL"
echo "  App URL: $MEDPLUM_APP_URL"
echo ""

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose-emr-https.yml down

# Build EMR app with HTTPS URLs
echo "🔨 Building EMR application..."
docker-compose -f docker-compose-emr-https.yml build emr-app

# Start all services
echo "🚀 Starting all services..."
docker-compose -f docker-compose-emr-https.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service status
echo ""
echo "📊 Service Status:"
docker-compose -f docker-compose-emr-https.yml ps

echo ""
echo "✅ Deployment complete!"
echo ""
echo "=========================================="
echo "Access your application:"
echo "=========================================="
echo "  EMR App: $MEDPLUM_APP_URL"
echo "  API: $MEDPLUM_BASE_URL"
echo ""
echo "View logs:"
echo "  docker-compose -f docker-compose-emr-https.yml logs -f"
echo ""
echo "Restart services:"
echo "  docker-compose -f docker-compose-emr-https.yml restart"
echo "=========================================="
