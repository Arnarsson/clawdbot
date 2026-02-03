# Jarvis Bridge Skill

Private skill for Eureka (Telegram agent) to access Jarvis long-term memory.

## Setup

1. Set environment variables in Clawdbot config:
   ```bash
   export JARVIS_API_URL="https://api.jarvis.eureka-ai.cc/api/v2"
   export JARVIS_API_KEY="your-private-api-key"
   ```

2. Restart Clawdbot:
   ```bash
   clawdbot restart
   ```

## How It Works

- **Smart Context Detection**: Eureka automatically queries Jarvis when context is needed
- **Explicit Commands**: Use `/jarvis search:`, `/jarvis task:`, etc.
- **Safety**: All writes tagged with `source: "EurekaTelegram"` and audit-logged
- **Fast**: 5-minute Redis cache for common searches
- **Append-Only**: Never deletes or modifies existing Jarvis data

## Audit Trail

Every write includes:
- `request_id`: Unique identifier for this operation
- `source: "EurekaTelegram"`
- `created_by: "Eureka"`
- `timestamp`: When it was created

View audit logs in Jarvis dashboard under Settings → Audit Log.
