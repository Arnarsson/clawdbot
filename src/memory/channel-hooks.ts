import { shouldExtractMemory, extractMemoryItems } from "./extractor.js";
import { writeDecisionToJarvis } from "./jarvis-writer.js";

export interface MemoryHookOptions {
  messageText: string;
  channelName: string;
  logger?: { debug: (msg: string) => void };
}

/**
 * Handles automatic memory extraction from channel messages.
 * Processes memory-worthy content and writes extracted decisions to Jarvis.
 * Errors are caught and logged without throwing to ensure channel handlers continue.
 *
 * @param opts - Configuration options for memory extraction
 * @returns Promise that resolves when extraction is complete
 */
export async function handleMemoryExtraction(opts: MemoryHookOptions): Promise<void> {
  try {
    // Validate input
    if (!opts.messageText || typeof opts.messageText !== "string") {
      throw new TypeError("messageText must be a non-empty string");
    }

    // Check if message warrants memory extraction
    if (!shouldExtractMemory(opts.messageText)) {
      return;
    }

    // Extract memory items from the message
    const items = extractMemoryItems({
      message: opts.messageText,
      context: `${opts.channelName}-extracted`,
    });

    // Process each extracted item
    for (const item of items) {
      if (item.type === "decision") {
        try {
          await writeDecisionToJarvis(item.content, `${opts.channelName}-auto-extract`);
        } catch (jarvisErr) {
          const jarvisErrMsg = jarvisErr instanceof Error ? jarvisErr.message : String(jarvisErr);
          opts.logger?.debug(
            `[Memory] Failed to write decision from ${opts.channelName}: ${jarvisErrMsg}`,
          );
        }
      }
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    opts.logger?.debug(`[Memory] Error in memory extraction for ${opts.channelName}: ${errMsg}`);
  }
}
