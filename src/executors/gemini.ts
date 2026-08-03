import type { BridgeConfig } from "../config/schema.js";
import type { Logger } from "../logging/logger.js";
import { HttpChatExecutor } from "./httpChat.js";

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

export class GeminiExecutor extends HttpChatExecutor {
  readonly name = "gemini";

  constructor(
    private readonly config: BridgeConfig,
    log: Logger,
  ) {
    super(log);
  }

  private get settings() {
    return this.config.executors.gemini;
  }

  private get apiKey(): string | undefined {
    return process.env[this.settings.api_key_env];
  }

  async isAvailable(): Promise<boolean> {
    return this.settings.enabled && !!this.apiKey;
  }

  protected async complete(prompt: string, timeoutMs: number): Promise<string> {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/` +
      `${this.settings.model}:generateContent`;
    const json = (await this.fetchJson(
      url,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": this.apiKey ?? "",
        },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      },
      timeoutMs,
    )) as GeminiResponse;
    const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
    if (!text) throw new Error("empty completion from Gemini");
    return text;
  }
}
