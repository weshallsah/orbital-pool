#!/bin/bash

echo "🧹 Cleaning Next.js cache..."
rm -rf .next
rm -rf node_modules/.cache

echo "🔄 Restarting development server..."
npm run dev
