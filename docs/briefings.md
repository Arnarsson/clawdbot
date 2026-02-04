# Clawdbot Briefings System

Briefings are automated message summaries sent to your messaging channels at scheduled times.

## Enabling Briefings

Set the `PHASE2_CONFIG_JSON` environment variable with your briefing preferences:

```json
{
  "briefings": {
    "morningBriefingEnabled": true,
    "morningTime": "08:00",
    "preMeetingBriefingEnabled": false,
    "weeklyBriefingEnabled": true,
    "weeklyDay": "monday",
    "weeklyTime": "09:00",
    "deliveryChannels": ["discord", "slack", "telegram"]
  }
}
```

## Supported Channels

- Discord (embeds)
- Slack (blocks)
- Telegram (markdown)
- Signal (markdown)
- iMessage (markdown)
- Teams (Adaptive Cards)
- Zalo (formatted text)

## Briefing Types

### Morning Briefing
Sends at a configured time each day with:
- Pending decisions from Jarvis
- Open loops from memory system

### Weekly Briefing
Sends on a specified day/time with summary of the week.

### Pre-Meeting Briefing
Triggered before calendar events (requires calendar integration).
