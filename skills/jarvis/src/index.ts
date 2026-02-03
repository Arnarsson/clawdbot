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
    `/search?${params.toString()}`
  );

  return response?.results ?? [];
}

async function writeTask(payload: WritePayload): Promise<{ id: string }> {
  const requestId = makeRequestId();

  const body = {
    title: payload.title,
    description: payload.description,
    priority: payload.priority || 'medium',
    due_date: payload.due_date,
    source: 'EurekaTelegram',
    created_by: 'Eureka',
    request_id: requestId,
    tags: ['eureka-auto'],
  };

  const response = await apiCall<{ id: string; created_at: string }>(
    '/tasks',
    { method: 'POST', body }
  );

  console.log(`[Jarvis] Task created: ${response.id} (req: ${requestId})`);
  return { id: response.id };
}

async function writeDecision(payload: WritePayload): Promise<{ id: string }> {
  const requestId = makeRequestId();

  const body = {
    title: payload.title,
    description: payload.description,
    priority: payload.priority || 'medium',
    status: 'pending',
    source: 'EurekaTelegram',
    created_by: 'Eureka',
    request_id: requestId,
  };

  const response = await apiCall<{ id: string; created_at: string }>(
    '/decisions',
    { method: 'POST', body }
  );

  console.log(`[Jarvis] Decision logged: ${response.id} (req: ${requestId})`);
  return { id: response.id };
}

async function getContext(): Promise<JarvisContext> {
  const [decisions, loops] = await Promise.all([
    apiCall<{ decisions: JarvisDecision[] }>('/decisions?status=pending&limit=10'),
    apiCall<{ open_loops: JarvisOpenLoop[] }>('/open-loops?status=open&limit=10'),
  ]);

  return {
    pending_decisions: decisions.decisions || [],
    open_loops: loops.open_loops || [],
    recent_memory_count: 0, // updated when search is called
  };
}
