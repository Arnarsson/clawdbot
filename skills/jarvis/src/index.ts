import type { WritePayload, SearchQuery, JarvisMemory, JarvisContext, JarvisDecision, JarvisOpenLoop } from './types.js';
import { apiCall, makeRequestId } from './client.js';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export { search, writeTask, writeDecision, getContext };

async function search(query: SearchQuery): Promise<JarvisMemory[]> {
  const params = new URLSearchParams({
    q: query.q,
    limit: String(query.limit || 25),
    ...(query.days_back && { days_back: String(query.days_back) }),
  });

  const response = await apiCall<{ results: JarvisMemory[] }>(
    `/bridge/search?${params.toString()}`
  );

  return response?.results ?? [];
}

// Priority mapping: string -> Linear integer (1=urgent, 2=high, 3=normal, 4=low)
const PRIORITY_MAP: Record<string, number> = {
  urgent: 1,
  high: 2,
  medium: 3,
  normal: 3,
  low: 4,
};

async function writeTask(payload: WritePayload): Promise<{ id: string }> {
  const requestId = makeRequestId();
  
  // Map priority string to integer, default to 3 (normal)
  const priorityInt = typeof payload.priority === 'string' 
    ? (PRIORITY_MAP[payload.priority.toLowerCase()] || 3)
    : (payload.priority || 3);

  // Linear API expects: title (required), description, priority (int)
  const body = {
    title: `${payload.title} [${requestId}]`,
    description: payload.description 
      ? `${payload.description}\n\n---\nSource: EurekaTelegram | Created by: Eureka`
      : `Source: EurekaTelegram | Created by: Eureka`,
    priority: priorityInt,
  };

  const response = await apiCall<{ id?: string; identifier?: string }>(
    '/actions/create-linear-task',
    { method: 'POST', body }
  );

  const taskId = response.id || response.identifier || requestId;
  console.log(`[Jarvis] Task created: ${taskId} (req: ${requestId})`);
  return { id: taskId };
}

async function writeDecision(payload: WritePayload): Promise<{ id: string }> {
  const requestId = makeRequestId();

  // Use quick capture endpoint to log decisions (bridge/decisions is GET-only)
  const captureText = `DECISION: ${payload.title}\n\n${payload.description || ''}\n\n---\nPriority: ${payload.priority || 'medium'}\nSource: EurekaTelegram\nCreated by: Eureka\nRequest ID: ${requestId}`;
  
  const body = {
    text: captureText,
    tags: ['decision', 'eureka-auto', payload.priority || 'medium'],
  };

  const response = await apiCall<{ id: string; created_at?: string }>(
    '/captures/quick',
    { method: 'POST', body }
  );

  console.log(`[Jarvis] Decision logged: ${response.id} (req: ${requestId})`);
  return { id: response.id };
}

async function getContext(): Promise<JarvisContext> {
  const [decisions, loopsResponse] = await Promise.all([
    apiCall<{ decisions: JarvisDecision[] }>('/bridge/decisions?limit=10').catch(() => ({ decisions: [] })),
    apiCall<JarvisOpenLoop[] | { items?: JarvisOpenLoop[]; open_loops?: JarvisOpenLoop[] }>('/open-loops?status=open&limit=10').catch(() => []),
  ]);

  // Handle different response shapes for open-loops
  let loops: JarvisOpenLoop[] = [];
  if (Array.isArray(loopsResponse)) {
    loops = loopsResponse;
  } else if (loopsResponse.items) {
    loops = loopsResponse.items;
  } else if (loopsResponse.open_loops) {
    loops = loopsResponse.open_loops;
  }

  return {
    pending_decisions: decisions.decisions || [],
    open_loops: loops,
    recent_memory_count: 0,
  };
}
