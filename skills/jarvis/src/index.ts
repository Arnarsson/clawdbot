import type { WritePayload, SearchQuery, JarvisMemory } from './types.js';
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
  // TODO: implement
  return { id: '' };
}

async function writeDecision(payload: WritePayload): Promise<{ id: string }> {
  // TODO: implement
  return { id: '' };
}

async function getContext(): Promise<any> {
  // TODO: implement
  return {};
}
