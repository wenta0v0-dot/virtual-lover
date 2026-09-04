import { AILogEntry } from "./types";

export class AILogger {
  private static instance: AILogger;

  private constructor() {}

  static getInstance(): AILogger {
    if (!AILogger.instance) {
      AILogger.instance = new AILogger();
    }
    return AILogger.instance;
  }

  logImageGeneration(entry: AILogEntry): void {
    const logData = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    console.log("[AI-Image]", JSON.stringify(logData, null, 2));

    if (entry.status === "error" && entry.error) {
      console.error(
        `[AI-Image-Error] Category: ${entry.error.category}, Code: ${entry.error.code}, Message: ${entry.error.message}`,
      );
    }
  }

  logRequestStart(provider: string, endpoint: string, model: string): number {
    const startTime = Date.now();
    console.log(
      `[AI-Image] Request started → Provider: ${provider}, Endpoint: ${endpoint}, Model: ${model}`,
    );
    return startTime;
  }

  logRequestEnd(
    startTime: number,
    entry: Omit<AILogEntry, "timestamp" | "durationMs">,
  ): void {
    const durationMs = Date.now() - startTime;
    this.logImageGeneration({
      ...entry,
      durationMs,
      timestamp: new Date().toISOString(), // 添加这一行
    });
  }
}

export default AILogger.getInstance();
