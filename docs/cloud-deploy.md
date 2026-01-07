---
summary: "Deploy Clawdbot Gateway to cloud platforms (Railway, Fly.io, Render)"
read_when:
  - You want to run the gateway on a cloud platform
  - You need a hosted gateway accessible from anywhere
  - You want to deploy to Railway, Fly.io, or Render
---

# Cloud Deployment

Clawdbot Gateway requires a **persistent runtime** with:
- Long-running process support (WebSocket server)
- Persistent storage for credentials and sessions
- Stable networking for provider connections

**Serverless platforms (Vercel, Netlify Functions, AWS Lambda) are NOT supported** because they terminate processes after HTTP responses.

## Recommended Platforms

| Platform | Pros | Cons |
|----------|------|------|
| **Railway** | Easy setup, generous free tier, persistent volumes | No free tier after trial |
| **Fly.io** | Global edge, persistent volumes, generous free tier | Slightly more complex setup |
| **Render** | Simple Docker deploy, auto-scaling | Volume support requires paid plan |

## Railway Deployment

### Prerequisites
- [Railway CLI](https://docs.railway.app/develop/cli) installed
- Railway account

### Deploy

```bash
# Login to Railway
railway login

# Create new project
railway init

# Link to repo (or deploy from GitHub)
railway link

# Add persistent volume for credentials/sessions
railway volume add --mount /root/.clawdbot

# Set environment variables
railway variables set NODE_ENV=production
railway variables set CLAWDBOT_GATEWAY_TOKEN=<your-secure-token>

# Deploy
railway up
```

### Environment Variables

Set these in Railway dashboard or via CLI:

| Variable | Required | Description |
|----------|----------|-------------|
| `CLAWDBOT_GATEWAY_TOKEN` | Yes | Secure token for gateway auth |
| `ANTHROPIC_API_KEY` | If using API | Anthropic API key |
| `OPENAI_API_KEY` | If using API | OpenAI API key |
| `TELEGRAM_BOT_TOKEN` | If using Telegram | Telegram bot token |
| `DISCORD_BOT_TOKEN` | If using Discord | Discord bot token |
| `SLACK_BOT_TOKEN` | If using Slack | Slack bot token |
| `SLACK_APP_TOKEN` | If using Slack | Slack app token |

### Post-Deploy Setup

1. Get your Railway URL from the dashboard
2. Configure providers via the Control UI at `https://<your-app>.railway.app`
3. For WhatsApp: run onboarding locally first, then copy `~/.clawdbot/credentials/` to the volume

## Fly.io Deployment

### Prerequisites
- [Fly CLI](https://fly.io/docs/hands-on/install-flyctl/) installed
- Fly.io account

### Deploy

```bash
# Login
fly auth login

# Launch (first time)
fly launch --no-deploy

# Create persistent volume
fly volumes create clawdbot_data --size 1 --region iad

# Set secrets
fly secrets set CLAWDBOT_GATEWAY_TOKEN=<your-secure-token>
fly secrets set ANTHROPIC_API_KEY=<your-key>

# Deploy
fly deploy
```

### Configuration

The `fly.toml` in the repo configures:
- Port 8080 (internal)
- Persistent volume at `/root/.clawdbot`
- Health checks at `/health`
- Auto-scaling disabled (single instance required for WebSocket state)

### Scaling

**Important**: Clawdbot Gateway must run as a single instance. Do not scale horizontally.

```bash
# Ensure single instance
fly scale count 1
```

## Render Deployment

### Using Dashboard

1. Create new **Web Service**
2. Connect your GitHub repo
3. Configure:
   - **Environment**: Docker
   - **Instance Type**: Starter or higher
   - **Health Check Path**: `/health`
4. Add environment variables (see Railway section)
5. Add persistent disk (requires paid plan):
   - Mount path: `/root/.clawdbot`
   - Size: 1 GB minimum

### Using render.yaml

Create `render.yaml` in repo root:

```yaml
services:
  - type: web
    name: clawdbot-gateway
    env: docker
    plan: starter
    healthCheckPath: /health
    disk:
      name: clawdbot-data
      mountPath: /root/.clawdbot
      sizeGB: 1
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: "8080"
      - key: CLAWDBOT_GATEWAY_TOKEN
        sync: false
```

## Provider Setup on Cloud

### WhatsApp (Baileys)

WhatsApp requires QR code scanning which needs local access:

1. Run onboarding locally first:
   ```bash
   bun run clawdbot onboard
   bun run clawdbot login
   ```

2. Copy credentials to cloud volume:
   ```bash
   # For Railway
   railway run cp -r ~/.clawdbot/credentials /root/.clawdbot/

   # For Fly.io
   fly ssh console -C "mkdir -p /root/.clawdbot/credentials"
   # Then use fly sftp to upload
   ```

3. Alternatively, use the WebChat UI to pair after deployment

### Telegram

Set `TELEGRAM_BOT_TOKEN` environment variable. No local setup needed.

### Discord

Set `DISCORD_BOT_TOKEN` environment variable. No local setup needed.

### Slack

Set both `SLACK_BOT_TOKEN` and `SLACK_APP_TOKEN` environment variables.

## Accessing the Gateway

### Control UI

Access the web dashboard at your deployment URL:
- Railway: `https://<app-name>.up.railway.app`
- Fly.io: `https://<app-name>.fly.dev`
- Render: `https://<app-name>.onrender.com`

### WebSocket Connection

Connect CLI or apps to the gateway:

```bash
# Set remote gateway
export CLAWDBOT_GATEWAY_URL=wss://<your-app>.railway.app

# Or in config
{
  "gateway": {
    "url": "wss://<your-app>.railway.app"
  }
}
```

### Authentication

Secure your gateway with a token:

```json5
{
  "gateway": {
    "auth": {
      "mode": "password",
      "password": "<your-secure-token>"
    }
  }
}
```

Set `CLAWDBOT_GATEWAY_TOKEN` to match.

## Troubleshooting

### Gateway not starting

Check logs:
```bash
# Railway
railway logs

# Fly.io
fly logs

# Render
# View in dashboard
```

### WhatsApp disconnecting

WhatsApp sessions can expire. Re-run login:
```bash
# SSH into container and run login
fly ssh console
node dist/entry.js login
```

### Health check failing

Ensure the gateway is bound to `0.0.0.0` (lan mode):
```bash
node dist/entry.js gateway --bind lan --port 8080
```

### Volume not persisting

Verify volume mount:
```bash
# Fly.io
fly ssh console -C "ls -la /root/.clawdbot"

# Railway
railway run ls -la /root/.clawdbot
```

## Cost Estimates

| Platform | Free Tier | Estimated Cost |
|----------|-----------|----------------|
| Railway | $5 credit/month | ~$5-10/month |
| Fly.io | 3 shared VMs free | ~$0-5/month |
| Render | No free tier for Docker | ~$7/month |

## Security Considerations

1. **Always set `CLAWDBOT_GATEWAY_TOKEN`** - prevents unauthorized access
2. **Use HTTPS only** - all platforms provide automatic TLS
3. **Restrict provider allowlists** - configure `allowFrom` for each provider
4. **Enable DM pairing** - default `dmPolicy: "pairing"` requires approval codes
5. **Review logs regularly** - monitor for suspicious activity

## Limitations vs Local

Running on cloud has some limitations:

- **No iMessage** - requires macOS host
- **No local browser automation** - browser tool won't work without additional setup
- **No Bonjour/mDNS** - local network discovery disabled
- **WhatsApp requires initial local setup** - QR code scanning needs local access first
- **Single instance only** - cannot horizontally scale the gateway
