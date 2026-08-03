import type { BridgeConfig } from "../config/schema.js";
import type { Logger } from "../logging/logger.js";
import { HttpChatExecutor } from "./httpChat.js";

interface ChatCompletionResponse {
  choices?: { message?: { content?: string } }[];
}

export class OpenAiExecutor extends HttpChatExecutor {
  readonly name = "openai";

  constructor(
    private readonly config: BridgeConfig,
    log: Logger,
  ) {
    super(log);
  }

  private get settings() {
    return this.config.executors.openai;
  }

  private get apiKey(): string | undefined {
    return process.env[this.settings.api_key_env];
  }

  async isAvailable(): Promise<boolean> {
    return this.settings.enabled && !!this.apiKey;
  }

  protected async complete(prompt: string, timeoutMs: number): Promise<string> {
    const body = {
      model: this.settings.model,
      messages: [{ role: "user", content: prompt }],
    };
    const json = (await this.fetchJson(
      `${this.settings.base_url}/chat/completions`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      },
      timeoutMs,
    )) as ChatCompletionResponse;
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("empty completion from OpenAI");
    return content;
  }
}
