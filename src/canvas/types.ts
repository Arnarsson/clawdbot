// src/canvas/types.ts
export interface CanvasAction {
  label: string;
  url?: string;
  action?: string;
}

export interface CanvasSection {
  title: string;
  content: string;
  actions?: CanvasAction[];
  metadata?: Record<string, unknown>;
}

export interface Canvas {
  title: string;
  description?: string;
  sections: CanvasSection[];
  metadata?: Record<string, unknown>;
}
