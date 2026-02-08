import { updatePinnedStatusMessage } from "./pinned-status.js";

/**
 * Send a Telegram notification message
 */
async function sendNotification(params: {
  chatId: string | number;
  text: string;
  token: string;
  emoji?: string;
}): Promise<{ ok: boolean }> {
  const message = params.emoji ? `${params.emoji} ${params.text}` : params.text;

  const response = await fetch(`https://api.telegram.org/bot${params.token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: params.chatId,
      text: message,
      disable_notification: false,
    }),
  });

  const result = await response.json();
  return { ok: result.ok };
}

/**
 * Notify about a deployment
 */
export async function notifyDeploy(params: {
  chatId: string | number;
  token: string;
  project: string;
  commit: string;
  success: boolean;
}): Promise<void> {
  const emoji = params.success ? "✅" : "❌";
  const status = params.success ? "deployed" : "deploy failed";
  const text = `${params.project} ${status} — commit ${params.commit}`;

  await sendNotification({
    chatId: params.chatId,
    token: params.token,
    text,
    emoji,
  });

  // Update pinned message
  await updatePinnedStatusMessage({
    chatId: params.chatId,
    token: params.token,
  });
}

/**
 * Notify about task completion
 */
export async function notifyTaskCompletion(params: {
  chatId: string | number;
  token: string;
  taskId: string;
  title: string;
}): Promise<void> {
  const text = `${params.taskId} Done — ${params.title}`;

  await sendNotification({
    chatId: params.chatId,
    token: params.token,
    text,
    emoji: "✅",
  });

  // Update pinned message
  await updatePinnedStatusMessage({
    chatId: params.chatId,
    token: params.token,
  });
}

/**
 * Notify about agent errors or blockers
 */
export async function notifyBlocker(params: {
  chatId: string | number;
  token: string;
  agent: string;
  task: string;
  error: string;
}): Promise<void> {
  const text = `${params.agent} stuck on ${params.task} — ${params.error}`;

  await sendNotification({
    chatId: params.chatId,
    token: params.token,
    text,
    emoji: "🚧",
  });

  // Update pinned message
  await updatePinnedStatusMessage({
    chatId: params.chatId,
    token: params.token,
  });
}

/**
 * Notify about task state change
 */
export async function notifyTaskStateChange(params: {
  chatId: string | number;
  token: string;
  taskId: string;
  fromState: string;
  toState: string;
}): Promise<void> {
  const emoji = params.toState === "Done" ? "✅" : params.toState === "In Progress" ? "🔄" : "📋";
  const text = `${params.taskId}: ${params.fromState} → ${params.toState}`;

  await sendNotification({
    chatId: params.chatId,
    token: params.token,
    text,
    emoji,
  });

  // Update pinned message
  await updatePinnedStatusMessage({
    chatId: params.chatId,
    token: params.token,
  });
}

/**
 * Periodic status update (called by heartbeat or cron)
 */
export async function sendPeriodicStatusUpdate(params: {
  chatId: string | number;
  token: string;
  force?: boolean;
}): Promise<{ ok: boolean; updated: boolean }> {
  const result = await updatePinnedStatusMessage({
    chatId: params.chatId,
    token: params.token,
    force: params.force,
  });

  return {
    ok: result.ok,
    updated: Boolean(result.updated || result.created),
  };
}
