#!/bin/bash
set -e
cd "$(dirname "$0")"

echo "→ Backend: installing dependencies..."
cd backend
npm ci --omit=dev

cd ../frontend
echo "→ Frontend: installing dependencies..."
npm ci

echo "→ Frontend: building production bundle..."
npm run build

cd ..
echo "→ Restarting services via pm2..."
pm2 startOrReload ecosystem.config.js
pm2 save

echo "✅ Deploy complete"
