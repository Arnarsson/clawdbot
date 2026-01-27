import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import { listSubagentRunsForRequester } from "../../agents/subagent-registry.js";

const execAsync = promisify(exec);

export type LinearTaskCounts = {
  todo: number;
  inProgress: number;
  doneToday: number;
  error?: string;
};

export type AgentStatus = {
  mason: "idle" | "active" | "error";
  eureka: "idle" | "active" | "error";
  subagents: number;
  masonTask?: string;
  eurekaTask?: string;
};

export type DeployInfo = {
  project: string;
  time: string;
  commit: string;
};

export type SystemStatusData = {
  linear: LinearTaskCounts;
  agents: AgentStatus;
  recentDeploys: DeployInfo[];
  blockers: string[];
};

/**
 * Fetch Linear task counts from the Linear API
 */
async function fetchLinearTasks(): Promise<LinearTaskCounts> {
  try {
    const apiKeyPath = path.join(process.env.HOME || "~", ".linear_api_key");
    const apiKey = (await fs.readFile(apiKeyPath, "utf-8")).trim();

    const teamId = "b4f3046f-b603-43fb-94b5-5f17dd9396e0";
    const todoStateId = "7ae2f220-6394-4117-97f3-3e10f58c4e47";
    const inProgressStateId = "941943ae-fa4e-4fac-96cb-a4a8a682999b";
    const doneStateId = "3ae46e12-b4dc-4d19-b1b9-fafd7a4eb88a";

    // Get Todo count
    const todoQuery = {
      query: `query { issues(filter: { team: { id: { eq: "${teamId}" } }, state: { id: { eq: "${todoStateId}" } } }) { nodes { id } } }`,
    };

    // Get In Progress count
    const inProgressQuery = {
      query: `query { issues(filter: { team: { id: { eq: "${teamId}" } }, state: { id: { eq: "${inProgressStateId}" } } }) { nodes { id identifier } } }`,
    };

    // Get Done today count (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const doneQuery = {
      query: `query { issues(filter: { team: { id: { eq: "${teamId}" } }, state: { id: { eq: "${doneStateId}" } }, completedAt: { gte: "${oneDayAgo}" } }) { nodes { id } } }`,
    };

    const fetchQuery = async (query: typeof todoQuery) => {
      const response = await fetch("https://api.linear.app/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: apiKey,
        },
        body: JSON.stringify(query),
      });
      return response.json();
    };

    const [todoResult, inProgressResult, doneResult] = await Promise.all([
      fetchQuery(todoQuery),
      fetchQuery(inProgressQuery),
      fetchQuery(doneQuery),
    ]);

    // Extract task identifiers from in-progress items
    const inProgressTasks =
      inProgressResult?.data?.issues?.nodes?.map((n: { identifier: string }) => n.identifier) ||
      [];

    return {
      todo: todoResult?.data?.issues?.nodes?.length || 0,
      inProgress: inProgressResult?.data?.issues?.nodes?.length || 0,
      doneToday: doneResult?.data?.issues?.nodes?.length || 0,
    };
  } catch (error) {
    return {
      todo: 0,
      inProgress: 0,
      doneToday: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get agent status (Mason, Eureka, sub-agents)
 */
function getAgentStatus(): AgentStatus {
  // List all subagent runs
  const allRuns = listSubagentRunsForRequester("");

  // Find Mason and Eureka runs
  const masonRun = allRuns.find(
    (r) => !r.endedAt && r.agentId === "mason" && r.sessionKey.includes("mason"),
  );
  const eurekaRun = allRuns.find(
    (r) => !r.endedAt && r.agentId === "eureka" && r.sessionKey.includes("eureka"),
  );

  const activeSubagents = allRuns.filter((r) => !r.endedAt).length;

  return {
    mason: masonRun ? "active" : "idle",
    eureka: eurekaRun ? "active" : "idle",
    subagents: activeSubagents,
    masonTask: masonRun?.label || undefined,
    eurekaTask: eurekaRun?.label || undefined,
  };
}

/**
 * Get recent deployment information from git log
 */
async function getRecentDeploys(): Promise<DeployInfo[]> {
  try {
    // Check for recent commits in key projects
    const projectPaths = [
      { name: "recruitos.xyz", path: "/home/sven/skillsync-recruitos" },
      { name: "agents.tips", path: "/home/sven/agents-tips" },
    ];

    const deploys: DeployInfo[] = [];

    for (const project of projectPaths) {
      try {
        const { stdout } = await execAsync(
          `cd ${project.path} && git log -1 --format="%h|%ar" origin/main 2>/dev/null || echo "unknown|unknown"`,
        );
        const [commit, time] = stdout.trim().split("|");
        if (commit !== "unknown") {
          deploys.push({ project: project.name, time, commit });
        }
      } catch {
        // Ignore errors for individual projects
      }
    }

    return deploys;
  } catch {
    return [];
  }
}

/**
 * Check for blockers (placeholder for now)
 */
function getBlockers(): string[] {
  // TODO: Implement blocker detection
  // - Check for failed cron jobs
  // - Check for stuck subagents
  // - Check for error logs
  return [];
}

/**
 * Fetch complete system status
 */
export async function fetchSystemStatus(): Promise<SystemStatusData> {
  const [linear, recentDeploys] = await Promise.all([
    fetchLinearTasks(),
    getRecentDeploys(),
  ]);

  const agents = getAgentStatus();
  const blockers = getBlockers();

  return {
    linear,
    agents,
    recentDeploys,
    blockers,
  };
}

/**
 * Format system status as a Telegram message
 */
export function formatSystemStatus(status: SystemStatusData): string {
  const lines: string[] = [];

  // Header
  const statusIcon = status.blockers.length > 0 ? "🔴" : "🟢";
  lines.push(`${statusIcon} **System Status**\n`);

  // Linear Tasks
  if (status.linear.error) {
    lines.push(`📋 **Linear**: Error - ${status.linear.error}`);
  } else {
    lines.push(
      `📋 **Linear Tasks**\n` +
        `  • Todo: ${status.linear.todo} | In Progress: ${status.linear.inProgress} | Done today: ${status.linear.doneToday}`,
    );
  }

  // Agents
  const masonStatus =
    status.agents.mason === "active"
      ? `active${status.agents.masonTask ? ` (${status.agents.masonTask})` : ""}`
      : "idle";
  const eurekaStatus =
    status.agents.eureka === "active"
      ? `active${status.agents.eurekaTask ? ` (${status.agents.eurekaTask})` : ""}`
      : "idle";

  lines.push(
    `\n🤖 **Agents**\n` +
      `  • Mason: ${masonStatus}\n` +
      `  • Eureka: ${eurekaStatus}\n` +
      `  • Sub-agents: ${status.agents.subagents} running`,
  );

  // Recent Deploys
  if (status.recentDeploys.length > 0) {
    lines.push(`\n🚀 **Recent Deploys**`);
    for (const deploy of status.recentDeploys) {
      lines.push(`  • ${deploy.project} — ${deploy.time} (${deploy.commit})`);
    }
  }

  // Blockers
  if (status.blockers.length > 0) {
    lines.push(`\n🚧 **Blockers**`);
    for (const blocker of status.blockers) {
      lines.push(`  • ${blocker}`);
    }
  } else {
    lines.push(`\n🚧 **Blockers**: None`);
  }

  return lines.join("\n");
}
