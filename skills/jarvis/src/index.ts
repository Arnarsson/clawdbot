import type { WritePayload, SearchQuery, JarvisMemory } from './types.js';

const API_BASE = process.env.JARVIS_API_URL || 'https://api.jarvis.eureka-ai.cc/api/v2';
const API_KEY = process.env.JARVIS_API_KEY;

if (!API_KEY) {
  throw new Error('JARVIS_API_KEY environment variable required');
}

// Cache key: "jarvis:search:<query>:<timestamp_bucket>"
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export { search, writeTask, writeDecision, getContext };

async function search(query: SearchQuery): Promise<JarvisMemory[]> {
  // TODO: implement
  return [];
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
