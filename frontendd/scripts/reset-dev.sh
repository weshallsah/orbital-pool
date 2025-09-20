#!/bin/bash

# Reset Next.js development environment
echo "🧹 Cleaning Next.js cache and dependencies..."

# Remove build artifacts
rm -rf .next
rm -rf node_modules
rm -f package-lock.json

# Reinstall dependencies
echo "📦 Reinstalling dependencies..."
npm install

# Start development server
echo "🚀 Starting development server..."
npm run dev
