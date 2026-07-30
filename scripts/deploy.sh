#!/bin/bash
set -e

PROJECT_DIR="/home/pasha/cook-and-fry"

cd "$PROJECT_DIR"

echo "Installing dependencies..."
npm install --production

echo "Creating logs directory..."
mkdir -p "$PROJECT_DIR/logs"

echo "Reloading / starting PM2 process..."
pm2 reload ecosystem.config.js --env production || pm2 start ecosystem.config.js --env production

echo "Saving PM2 process list..."
pm2 save

echo "Deploy complete. Service: cook-and-fry"
