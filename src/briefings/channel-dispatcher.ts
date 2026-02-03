import { createMorningBriefing, createPreMeetingBriefing } from "./aggregator.js";
import { renderCanvas } from "../canvas/router.js";

export type ChannelType =
  | "discord"
  | "slack"
  | "telegram"
  | "signal"
  | "imessage"
  | "teams"
  | "zalo";

export interface BriefingDispatcherOptions {
  enabledChannels: ChannelType[];
  logger?: { info: (msg: string) => void; error: (msg: string) => void };
}

export interface ChannelSender {
  send: (channelId: string, canvas: unknown) => Promise<void>;
}

export async function dispatchMorningBriefing(
  senders: Record<ChannelType, ChannelSender>,
  opts: BriefingDispatcherOptions,
): Promise<void> {
  try {
    const briefing = await createMorningBriefing();
    opts.logger?.info("[Briefing] Generating morning briefing");

    for (const channel of opts.enabledChannels) {
      try {
        const rendered = renderCanvas(channel, briefing);
        await senders[channel].send(channel, rendered);
        opts.logger?.info(`[Briefing] Morning briefing sent to ${channel}`);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        opts.logger?.error(`[Briefing] Failed to send morning briefing to ${channel}: ${errMsg}`);
      }
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    opts.logger?.error(`[Briefing] Morning briefing generation failed: ${errMsg}`);
  }
}

export async function dispatchPreMeetingBriefing(
  senders: Record<ChannelType, ChannelSender>,
  opts: BriefingDispatcherOptions,
): Promise<void> {
  try {
    const briefing = await createPreMeetingBriefing();
    opts.logger?.info("[Briefing] Generating pre-meeting briefing");

    for (const channel of opts.enabledChannels) {
      try {
        const rendered = renderCanvas(channel, briefing);
        await senders[channel].send(channel, rendered);
        opts.logger?.info(`[Briefing] Pre-meeting briefing sent to ${channel}`);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        opts.logger?.error(
          `[Briefing] Failed to send pre-meeting briefing to ${channel}: ${errMsg}`,
        );
      }
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    opts.logger?.error(`[Briefing] Pre-meeting briefing generation failed: ${errMsg}`);
  }
}
