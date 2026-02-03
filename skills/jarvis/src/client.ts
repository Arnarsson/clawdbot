const API_BASE = process.env.JARVIS_API_URL || 'https://api.jarvis.eureka-ai.cc/api/v2';
const API_KEY = process.env.JARVIS_API_KEY;

interface FetchOptions {
  method?: 'GET' | 'POST' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
}

export async function apiCall<T>(
  path: string,
  options: FetchOptions = {},
  retries = 3,
  shouldRetry: (err: Error, attempt: number) => boolean = defaultShouldRetry
): Promise<T> {
  if (!API_KEY) throw new Error('JARVIS_API_KEY not set');

  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    'User-Agent': 'Clawdbot/Eureka',
    ...options.headers,
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`Jarvis API error: ${response.status} ${response.statusText}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < retries - 1 && shouldRetry(lastError, attempt)) {
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt))); // exponential backoff
      }
    }
  }

  throw lastError || new Error('Jarvis API call failed');
}

function defaultShouldRetry(err: Error, attempt: number): boolean {
  // Don't retry client errors (4xx) or auth errors (401, 403)
  const msg = err.message.toLowerCase();
  if (msg.includes('401') || msg.includes('403') || msg.includes('4')) {
    return false; // Don't retry client errors
  }
  if (msg.includes('503') || msg.includes('timeout')) {
    return true; // DO retry server errors and timeouts
  }
  return attempt < 2; // Default: retry up to 2 times
}

export function makeRequestId(): string {
  return `eureka-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
