import type { IncomingMessage, ServerResponse } from "node:http";
import { spawn } from "node:child_process";
import { createSubsystemLogger } from "../logging/subsystem.js";

const log = createSubsystemLogger("linear-webhook");

interface LinearWebhookPayload {
  action: string;
  type: string;
  data: {
    id: string;
    body?: string;
    issueId?: string;
    userId?: string;
    createdAt?: string;
  };
  url?: string;
}

/**
 * Handle Linear webhook HTTP POST requests
 * Routes to the linear-webhook skill handler
 */
export async function handleLinearWebhookHttpRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

  // Check if this is a Linear webhook request
  if (url.pathname !== "/api/linear-webhook") {
    return false;
  }

  // Only accept POST requests
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Allow", "POST");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Method Not Allowed");
    return true;
  }

  try {
    // Read request body
    const body = await readRequestBody(req);
    const payload: LinearWebhookPayload = JSON.parse(body);

    log.info(`Received Linear webhook: action=${payload.action} type=${payload.type}`);

    // Spawn handler script in background
    const handlerPath = "/home/sven/clawd/skills/linear-webhook/handler.sh";
    const handler = spawn("bash", [handlerPath], {
      stdio: ["pipe", "inherit", "inherit"],
      detached: true,
    });

    // Write payload to handler's stdin
    handler.stdin?.write(body);
    handler.stdin?.end();

    // Don't wait for handler to complete
    handler.unref();

    // Respond immediately
    res.statusCode = 202;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: true, message: "Webhook received" }));

    return true;
  } catch (error) {
    log.error(`Linear webhook error: ${String(error)}`);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: false, error: "Internal server error" }));
    return true;
  }
}

/**
 * Read the full request body as a string
 */
function readRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}
