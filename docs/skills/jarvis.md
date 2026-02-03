# Jarvis Memory Bridge Skill

Private skill enabling Eureka (Telegram agent) to query your long-term memory.

## Configuration

Set in Clawdbot:
- `JARVIS_API_URL`: API base URL (default: `https://api.jarvis.eureka-ai.cc/api/v2`)
- `JARVIS_API_KEY`: Private API key (required)

## Features

- **Smart Context Detection**: Automatically queries Jarvis when context is needed
- **Search**: Find captures, conversations, decisions
- **Write with Safety**: Create tasks/decisions tagged `EurekaTelegram`
- **Caching**: 5-minute TTL on common searches
- **Audit Trail**: Every write logged with `request_id`

## Example Usage (Telegram)

```
@eureka what did we discuss about budget?
→ [Memory]: discussion from Jan 2026...

@eureka task: review quarterly targets by Friday
→ [Task created: eureka-xxx-xxx]

@eureka context
→ [Pending]: 3 decisions, 2 open loops
```
