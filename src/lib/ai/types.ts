export interface ImageGenOptions {
  prompt: string;
  size?: "1280x1280";
  imageUrl?: string;
}

export interface ImageGenResult {
  success: boolean;
  imageUrls?: string[];
  error?: {
    code: number;
    message: string;
    retryable: boolean;
    category?: string;
  };
}

export interface ZhipuAIImageRequest {
  model: string;
  prompt: string;
  size: string;
  image_url?: string;
}

export interface ZhipuAIImageData {
  url: string;
}

export interface ZhipuAIImageResponse {
  created: number;
  data: ZhipuAIImageData[];
  id: string;
  request_id: string;
}

export type ErrorCategory =
  | "auth"
  | "permission"
  | "rate_limit"
  | "server"
  | "timeout"
  | "unknown";

export interface AILogEntry {
  timestamp: string;
  provider: string;
  endpoint: string;
  model: string;
  promptLength: number;
  size: string;
  durationMs: number;
  status: "success" | "error";
  statusCode?: number;
  imageCount?: number;
  error?: {
    category: ErrorCategory;
    message: string;
    code: number;
  };
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatStreamOptions {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ZhipuAIChatRequest {
  model: string;
  messages: ChatMessage[];
  stream: boolean;
  temperature?: number;
  max_tokens?: number;
}

export interface ZhipuAIChatDelta {
  content?: string;
  reasoning_content?: string;
}

export interface ZhipuAIChatChoice {
  index: number;
  delta?: ZhipuAIChatDelta;
  message?: {
    content: string;
    role: string;
    reasoning_content?: string;
  };
  finish_reason: string | null;
}

export interface ZhipuAIChatUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ZhipuAIChatStreamResponse {
  id: string;
  choices: ZhipuAIChatChoice[];
  created: number;
  model: string;
  object: string;
  usage?: ZhipuAIChatUsage;
}

export interface ZhipuAIChatResponse {
  id: string;
  choices: ZhipuAIChatChoice[];
  created: number;
  model: string;
  object: "chat.completion";
  request_id: string;
  usage: ZhipuAIChatUsage;
}
