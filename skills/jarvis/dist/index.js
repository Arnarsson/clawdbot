import { apiCall, makeRequestId } from './client.js';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
export { search, writeTask, writeDecision, getContext };
async function search(query) {
    const params = new URLSearchParams({
        q: query.q,
        limit: String(query.limit || 25),
        ...(query.days_back && { days_back: String(query.days_back) }),
    });
    const response = await apiCall(`/bridge/search?${params.toString()}`);
    return response?.results ?? [];
}
async function writeTask(payload) {
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
    const response = await apiCall('/actions/create-linear-task', { method: 'POST', body });
    console.log(`[Jarvis] Task created: ${response.id} (req: ${requestId})`);
    return { id: response.id };
}
async function writeDecision(payload) {
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
    const response = await apiCall('/bridge/decisions', { method: 'POST', body });
    console.log(`[Jarvis] Decision logged: ${response.id} (req: ${requestId})`);
    return { id: response.id };
}
async function getContext() {
    const [decisions, loops] = await Promise.all([
        apiCall('/bridge/decisions?status=pending&limit=10'),
        apiCall('/open-loops?status=open&limit=10'),
    ]);
    return {
        pending_decisions: decisions.decisions || [],
        open_loops: loops.open_loops || [],
        recent_memory_count: 0, // updated when search is called
    };
}
