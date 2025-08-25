#!/bin/bash
set -euo pipefail

# Environment defaults
export TZ="${TZ:-Asia/Jakarta}"
export NODE_OPTIONS="${NODE_OPTIONS:-} --max_old_space_size=2048"
DEV_PORT="${DEV_PORT:-5173}"

echo "🚀 Starting SOAP Manager development server..."
echo "📍 Timezone: $TZ"
echo "🔧 Port: $DEV_PORT"

# Copy .env if missing
if [ ! -f .env ] && [ -f .env.example ]; then
    echo "📋 Copying .env.example to .env"
    cp .env.example .env
fi

# Check if Supabase env vars are set
if [ -f .env ]; then
    source .env
    if [ -z "${PUBLIC_SUPABASE_URL:-}" ] || [ -z "${PUBLIC_SUPABASE_ANON_KEY:-}" ]; then
        echo "⚠️  Warning: Supabase environment variables not configured"
        echo "📝 Please update .env with your Supabase project details"
    else
        echo "✅ Supabase configuration found"
    fi
fi

# Start the development server
exec npm run dev -- --host --port "$DEV_PORT"
