#!/bin/bash

# Build script for stock refresh microservice
# Usage: ./build.sh [docker]

set -e

# Navigate to the script directory
cd "$(dirname "$0")"

if [ "$1" == "docker" ]; then
    echo "🐳 Building Docker image..."
    docker build -t stock-refresh .
    echo "✅ Docker image built successfully: stock-refresh"
    echo ""
    echo "To run with Docker:"
    echo "  docker run --rm --env-file ../../.env stock-refresh"
    echo ""
    echo "To run in background:"
    echo "  docker run -d --name stock-refresh-job --env-file ../../.env stock-refresh"
    echo ""
    echo "For cronjob (daily at 6 PM):"
    echo "  0 18 * * * docker run --rm --env-file $(pwd)/../../.env stock-refresh >> $(pwd)/refresh.log 2>&1"
else
    echo "🏗️  Building Go binary..."
    
    # Ensure dependencies are downloaded
    go mod tidy
    
    # Build the binary
    go build -o stock-refresh .
    
    echo "✅ Binary built successfully: ./stock-refresh"
    echo ""
    echo "To run manually:"
    echo "  ./stock-refresh"
    echo ""
    echo "To build Docker image instead:"
    echo "  ./build.sh docker"
    echo ""
    echo "For binary cronjob (daily at 6 PM):"
    echo "  0 18 * * * cd $(pwd) && ./stock-refresh >> refresh.log 2>&1"
fi