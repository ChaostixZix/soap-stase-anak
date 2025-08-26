#!/bin/bash

# Telegram Webhook Setup Script
# Usage: ./scripts/setup-telegram-webhook.sh <webhook_url>

if [ $# -ne 1 ]; then
    echo "Usage: $0 <webhook_url>"
    echo "Example: $0 https://your-app.com/webhooks/telegram"
    exit 1
fi

WEBHOOK_URL="$1"

# Check if environment variables are set
if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo "Error: TELEGRAM_BOT_TOKEN is not set"
    echo "Please set your bot token: export TELEGRAM_BOT_TOKEN=your_bot_token"
    exit 1
fi

if [ -z "$TELEGRAM_WEBHOOK_SECRET" ]; then
    echo "Error: TELEGRAM_WEBHOOK_SECRET is not set"
    echo "Please set your webhook secret: export TELEGRAM_WEBHOOK_SECRET=your_random_secret"
    exit 1
fi

echo "Setting up Telegram webhook..."
echo "Bot Token: ${TELEGRAM_BOT_TOKEN:0:10}..."
echo "Webhook URL: $WEBHOOK_URL"
echo "Secret: ${TELEGRAM_WEBHOOK_SECRET:0:5}..."

# Set the webhook
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"$WEBHOOK_URL\",
    \"secret_token\": \"$TELEGRAM_WEBHOOK_SECRET\"
  }"

echo -e "\n\nWebhook setup complete!"
echo "To verify, run:"
echo "curl \"https://api.telegram.org/bot\${TELEGRAM_BOT_TOKEN}/getWebhookInfo\""