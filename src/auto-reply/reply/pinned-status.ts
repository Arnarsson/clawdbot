import fs from "node:fs/promises";
import path from "node:path";
import { fetchSystemStatus, formatSystemStatus } from "./system-status.js";

/**
 * State file to store pinned message metadata
 */
const PINNED_STATE_FILE = path.join(
  process.env.HOME || "~",
  ".config",
  "clawdbot",
  "pinned-status-state.json",
);

type PinnedMessageState = {
  messageId: number;
  chatId: string | number;
  lastUpdated: number;
};

/**
 * Load pinned message state from disk
 */
async function loadPinnedState(): Promise<PinnedMessageState | null> {
  try {
    const data = await fs.readFile(PINNED_STATE_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Save pinned message state to disk
 */
async function savePinnedState(state: PinnedMessageState): Promise<void> {
  const dir = path.dirname(PINNED_STATE_FILE);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(PINNED_STATE_FILE, JSON.stringify(state, null, 2));
}

/**
 * Send a Telegram message
 */
async function sendTelegramMessage(params: {
  chatId: string | number;
  text: string;
  token: string;
  parseMode?: "Markdown" | "HTML";
  disableNotification?: boolean;
}): Promise<{ ok: boolean; result?: { message_id: number } }> {
  const response = await fetch(`https://api.telegram.org/bot${params.token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: params.chatId,
      text: params.text,
      parse_mode: params.parseMode || "Markdown",
      disable_notification: params.disableNotification ?? true,
    }),
  });
  return response.json();
}

/**
 * Edit an existing Telegram message
 */
async function editTelegramMessage(params: {
  chatId: string | number;
  messageId: number;
  text: string;
  token: string;
  parseMode?: "Markdown" | "HTML";
}): Promise<{ ok: boolean; result?: unknown }> {
  const response = await fetch(`https://api.telegram.org/bot${params.token}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: params.chatId,
      message_id: params.messageId,
      text: params.text,
      parse_mode: params.parseMode || "Markdown",
    }),
  });
  return response.json();
}

/**
 * Pin a Telegram message
 */
async function pinTelegramMessage(params: {
  chatId: string | number;
  messageId: number;
  token: string;
  disableNotification?: boolean;
}): Promise<{ ok: boolean }> {
  const response = await fetch(`https://api.telegram.org/bot${params.token}/pinChatMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: params.chatId,
      message_id: params.messageId,
      disable_notification: params.disableNotification ?? true,
    }),
  });
  return response.json();
}

/**
 * Create or update the pinned status message
 */
export async function updatePinnedStatusMessage(params: {
  chatId: string | number;
  token: string;
  force?: boolean;
}): Promise<{ ok: boolean; created?: boolean; updated?: boolean; error?: string }> {
  try {
    // Fetch current system status
    const systemStatus = await fetchSystemStatus();
    const statusText = formatSystemStatus(systemStatus);

    // Load existing pinned message state
    const state = await loadPinnedState();

    // If no pinned message exists, create one
    if (!state || params.force) {
      const sendResult = await sendTelegramMessage({
        chatId: params.chatId,
        text: statusText,
        token: params.token,
        parseMode: "Markdown",
        disableNotification: true,
      });

      if (!sendResult.ok || !sendResult.result) {
        return { ok: false, error: "Failed to send message" };
      }

      const messageId = sendResult.result.message_id;

      // Pin the message
      const pinResult = await pinTelegramMessage({
        chatId: params.chatId,
        messageId,
        token: params.token,
        disableNotification: true,
      });

      if (!pinResult.ok) {
        return { ok: false, error: "Failed to pin message" };
      }

      // Save state
      await savePinnedState({
        messageId,
        chatId: params.chatId,
        lastUpdated: Date.now(),
      });

      return { ok: true, created: true };
    }

    // Update existing pinned message
    const editResult = await editTelegramMessage({
      chatId: state.chatId,
      messageId: state.messageId,
      text: statusText,
      token: params.token,
      parseMode: "Markdown",
    });

    if (!editResult.ok) {
      // If edit failed, the message might have been deleted
      // Try creating a new one
      return updatePinnedStatusMessage({ ...params, force: true });
    }

    // Update last updated timestamp
    await savePinnedState({
      ...state,
      lastUpdated: Date.now(),
    });

    return { ok: true, updated: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get the age of the pinned message in milliseconds
 */
export async function getPinnedMessageAge(): Promise<number | null> {
  const state = await loadPinnedState();
  if (!state) return null;
  return Date.now() - state.lastUpdated;
}

/**
 * Check if pinned message needs updating (older than threshold)
 */
export async function shouldUpdatePinnedMessage(thresholdMs: number = 60000): Promise<boolean> {
  const age = await getPinnedMessageAge();
  if (age === null) return true; // No pinned message, should create one
  return age > thresholdMs;
}
