import type { WritePayload, SearchQuery, JarvisMemory } from './types.js';
export { search, writeTask, writeDecision, getContext };
declare function search(query: SearchQuery): Promise<JarvisMemory[]>;
declare function writeTask(payload: WritePayload): Promise<{
    id: string;
}>;
declare function writeDecision(payload: WritePayload): Promise<{
    id: string;
}>;
declare function getContext(): Promise<any>;
