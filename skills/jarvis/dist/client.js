const API_BASE = process.env.JARVIS_API_URL || 'http://localhost:8000/api/v2';
const API_KEY = process.env.JARVIS_API_KEY || 'dev-local-key-eureka-telegram';
export async function apiCall(path, options = {}, retries = 3, shouldRetry = defaultShouldRetry) {
    if (!API_KEY)
        throw new Error('JARVIS_API_KEY not set');
    const url = `${API_BASE}${path}`;
    const headers = {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Clawdbot/Eureka',
        ...options.headers,
    };
    let lastError = null;
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
            return (await response.json());
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            if (attempt < retries - 1 && shouldRetry(lastError, attempt)) {
                await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt))); // exponential backoff
            }
        }
    }
    throw lastError || new Error('Jarvis API call failed');
}
function defaultShouldRetry(err, attempt) {
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
export function makeRequestId() {
    return `eureka-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
