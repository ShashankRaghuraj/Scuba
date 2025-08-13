#!/bin/bash

# Scuba Browser - SearXNG Startup Script

echo "🐧 Starting SearXNG for Scuba Browser..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Change to searxng directory
cd searxng

echo "📦 Starting SearXNG services..."

# Start the services
docker-compose up -d

# Check if services are running
sleep 3

if docker-compose ps | grep -q "Up"; then
    echo "✅ SearXNG is starting up!"
    echo ""
    echo "🔍 SearXNG will be available at: http://localhost:8080"
    echo "📡 JSON API available at: http://localhost:8080/search?q=YOUR_QUERY&format=json"
    echo ""
    echo "🧪 Test the API with:"
    echo "curl \"http://localhost:8080/search?q=javascript&format=json\""
    echo ""
    echo "🛑 To stop SearXNG:"
    echo "cd searxng && docker-compose down"
    echo ""
    echo "⏳ Waiting for services to be fully ready (this may take 30-60 seconds)..."
    
    # Wait for SearXNG to be ready
    for i in {1..30}; do
        if curl -s http://localhost:8080 > /dev/null 2>&1; then
            echo "🎉 SearXNG is ready! You can now use Scuba Browser with custom search."
            break
        fi
        echo "   Waiting... ($i/30)"
        sleep 2
    done
    
    if ! curl -s http://localhost:8080 > /dev/null 2>&1; then
        echo "⚠️  SearXNG may still be starting up. Check http://localhost:8080 in a few minutes."
    fi
    
else
    echo "❌ Failed to start SearXNG services. Check Docker logs:"
    docker-compose logs
    exit 1
fi
