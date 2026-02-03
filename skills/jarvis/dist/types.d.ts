export interface JarvisMemory {
    id: string;
    type: 'capture' | 'conversation' | 'email' | 'meeting';
    title?: string;
    content: string;
    created_at: string;
    source?: string;
}
export interface JarvisDecision {
    id: string;
    title: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
}
export interface JarvisOpenLoop {
    id: string;
    title: string;
    type: 'waiting_on' | 'my_commitment' | 'follow_up';
    due_at?: string;
    status: 'open' | 'closed';
}
export interface SearchQuery {
    q: string;
    limit?: number;
    days_back?: number;
}
export interface WritePayload {
    title: string;
    description?: string;
    type?: string;
    priority?: 'low' | 'medium' | 'high';
    due_date?: string;
}
