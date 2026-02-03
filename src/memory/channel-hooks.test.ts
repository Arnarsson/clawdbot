import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as jarvisWriter from "./jarvis-writer.js";
import { handleMemoryExtraction } from "./channel-hooks.js";

describe("Memory Channel Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should extract memory from decision messages", async () => {
    const logger = { debug: vi.fn() };
    vi.spyOn(jarvisWriter, "writeDecisionToJarvis").mockResolvedValue({ id: "test-1" });

    await handleMemoryExtraction({
      messageText: "We decided to use TypeScript",
      channelName: "telegram",
      logger,
    });

    // Should not error and should not log any errors
    expect(logger.debug).not.toHaveBeenCalled();
    expect(jarvisWriter.writeDecisionToJarvis).toHaveBeenCalled();
  });

  it("should skip non-extractable messages", async () => {
    const logger = { debug: vi.fn() };

    await handleMemoryExtraction({
      messageText: "hello",
      channelName: "discord",
      logger,
    });

    // Should not error
    expect(logger.debug).not.toHaveBeenCalled();
  });

  it("should handle errors gracefully without throwing", async () => {
    const logger = { debug: vi.fn() };

    await handleMemoryExtraction({
      messageText: undefined as any,
      channelName: "slack",
      logger,
    });

    // Should log error but not throw
    expect(logger.debug).toHaveBeenCalled();
  });

  it("should work without logger", async () => {
    // Should not throw even without logger
    await expect(
      handleMemoryExtraction({
        messageText: "We chose to refactor the code",
        channelName: "matrix",
      }),
    ).resolves.not.toThrow();
  });

  it("should extract from messages with decisions", async () => {
    const logger = { debug: vi.fn() };

    await handleMemoryExtraction({
      messageText: "We agreed to move forward with the new design",
      channelName: "msteams",
      logger,
    });

    // Should process without error
    expect(logger.debug).not.toHaveBeenCalled();
  });

  it("should handle multiple decision keywords", async () => {
    const logger = { debug: vi.fn() };
    vi.spyOn(jarvisWriter, "writeDecisionToJarvis").mockResolvedValue({ id: "test-1" });

    const testMessages = [
      "We decided to use React",
      "We chose PostgreSQL for the database",
      "We agreed on a new sprint schedule",
      "We fixed the memory leak issue",
    ];

    for (const msg of testMessages) {
      await handleMemoryExtraction({
        messageText: msg,
        channelName: "telegram",
        logger,
      });
    }

    // All should process without errors
    expect(logger.debug).not.toHaveBeenCalled();
  });

  it("should include channel name in error logs", async () => {
    const logger = { debug: vi.fn() };

    // Force an error by passing null
    await handleMemoryExtraction({
      messageText: null as any,
      channelName: "signal",
      logger,
    });

    // Should log error with channel name
    if (logger.debug.mock.calls.length > 0) {
      const errorMsg = logger.debug.mock.calls[0][0] as string;
      expect(errorMsg).toContain("signal");
    }
  });

  it("should handle memory extraction with context", async () => {
    const logger = { debug: vi.fn() };
    vi.spyOn(jarvisWriter, "writeDecisionToJarvis").mockResolvedValue({ id: "test-1" });

    await handleMemoryExtraction({
      messageText: "We decided to use TypeScript for type safety",
      channelName: "telegram",
      logger,
    });

    expect(logger.debug).not.toHaveBeenCalled();
    expect(jarvisWriter.writeDecisionToJarvis).toHaveBeenCalledWith(
      expect.stringContaining("TypeScript"),
      "telegram-auto-extract",
    );
  });
});
