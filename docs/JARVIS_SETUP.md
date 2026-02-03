# Setting Up Jarvis Bridge for Eureka

## Prerequisites
- Jarvis API running at `api.jarvis.eureka-ai.cc` (or custom URL)
- Valid API key with read + write access

## Installation

1. Copy `.env.example` to `.env` and fill in:
   ```bash
   JARVIS_API_KEY=your-key-here
   ```

2. Restart Clawdbot:
   ```bash
   clawdbot restart
   ```

3. Test in Telegram:
   ```
   @eureka context
   → Should return pending decisions/loops from Jarvis
   ```

## Troubleshooting

- If Eureka doesn't query Jarvis: Check `JARVIS_API_KEY` is set
- If writes fail: Verify API key has write permissions
- Check logs: `clawdbot logs | grep Jarvis`

## Privacy & Security

- All writes tagged `source: "EurekaTelegram"` for audit
- API key stored in Clawdbot config (not in chat history)
- Never deletes data; writes are append-only
