#!/bin/bash
set -euo pipefail

# ---- Load nvm if available ----

[ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh"

# ---- Environment defaults ----

export TZ="${TZ:-Asia/Jakarta}"
export NODE_OPTIONS="${NODE_OPTIONS:-} --max_old_space_size=2048"
DEV_PORT="${DEV_PORT:-5173}"

# ---- Pick app dir ----

APP_DIR="."
if [ -d "app" ]; then
APP_DIR="app"
fi
cd "$APP_DIR"

# ---- Run SvelteKit dev server ----

if [ -f package.json ]; then

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

# Prefer npm; swap to yarn/pnpm if you use them

exec npm run dev -- --host --port "$DEV_PORT"
else
echo "No package.json in $APP_DIR. Nothing to start." >&2
exit 1
fi