---
name: jarvis
description: Query and update your personal AI memory system directly from Telegram
metadata: {"clawdbot":{"emoji":"🧠","os":["darwin","linux"]}}
---

# Jarvis Memory Bridge

Query and update your personal AI memory system directly from Telegram.

## Usage

### Search Memory
```
/jarvis search: what did we discuss about X?
```

### Get Pending Items
```
/jarvis context
```

### Create Task
```
/jarvis task: buy milk by Friday
```

### Log Decision
```
/jarvis decision: approved budget increase for Q2
```

## Triggers

Eureka automatically queries Jarvis when you ask:
- "What did we discuss about...?"
- "Remember when...?"
- "What's my status on...?"
- "What decisions are pending?"

All writes are tagged `EurekaTelegram` for tracking.
