import type { BridgeConfig } from "../config/schema.js";
import type { Logger } from "../logging/logger.js";
import { HttpChatExecutor } from "./httpChat.js";

interface OllamaResponse {
  response?: string;
}

export class OllamaExecutor extends HttpChatExecutor {
  readonly name = "ollama";

  constructor(
    private readonly config: BridgeConfig,
    log: Logger,
  ) {
    super(log);
  }

  private get settings() {
    return this.config.executors.ollama;
  }

  async isAvailable(): Promise<boolean> {
    if (!this.settings.enabled) return false;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3_000);
      const res = await fetch(`${this.settings.base_url}/api/tags`, { signal: controller.signal });
      clearTimeout(timer);
      return res.ok;
    } catch {
      return false;
    }
  }

  protected async complete(prompt: string, timeoutMs: number): Promise<string> {
    const json = (await this.fetchJson(
      `${this.settings.base_url}/api/generate`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ model: this.settings.model, prompt, stream: false }),
      },
      timeoutMs,
    )) as OllamaResponse;
    if (!json.response) throw new Error("empty completion from Ollama");
    return json.response;
  }
}
