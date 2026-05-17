import { afterEach, describe, expect, it } from "vitest";
import { createCodexCliModelClient, createModelClient, parseCodexJsonl } from "./openaiClient";
import type { CompletionEvent } from "./types";

describe("openai client setup", () => {
  const originalKey = process.env.OPENAI_API_KEY;
  const originalTestMode = process.env.TOKEN_CALORIMETER_TEST_MODE;
  const originalProvider = process.env.TOKEN_CALORIMETER_PROVIDER;
  const originalModel = process.env.OPENAI_MODEL;
  const originalCodexModel = process.env.CODEX_MODEL;

  afterEach(() => {
    restoreEnv("OPENAI_API_KEY", originalKey);
    restoreEnv("TOKEN_CALORIMETER_TEST_MODE", originalTestMode);
    restoreEnv("TOKEN_CALORIMETER_PROVIDER", originalProvider);
    restoreEnv("OPENAI_MODEL", originalModel);
    restoreEnv("CODEX_MODEL", originalCodexModel);
  });

  it("falls back to Codex auth when the server API key is missing", () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.TOKEN_CALORIMETER_TEST_MODE;
    delete process.env.TOKEN_CALORIMETER_PROVIDER;

    expect(() => createModelClient()).not.toThrow();
  });

  it("fails clearly when OpenAI provider is selected without an API key", () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.TOKEN_CALORIMETER_TEST_MODE;
    process.env.TOKEN_CALORIMETER_PROVIDER = "openai";

    expect(() => createModelClient()).toThrow(/TOKEN_CALORIMETER_PROVIDER=openai/);
  });

  it("parses Codex JSONL output and usage", () => {
    const result = parseCodexJsonl(
      [
        '{"type":"thread.started","thread_id":"example"}',
        '{"type":"item.completed","item":{"type":"agent_message","text":"hello"}}',
        '{"type":"turn.completed","usage":{"input_tokens":12,"output_tokens":3,"total_tokens":15}}'
      ].join("\n")
    );

    expect(result.output).toBe("hello");
    expect(result.usage).toEqual({ input_tokens: 12, output_tokens: 3, total_tokens: 15 });
  });

  it("streams a Codex-backed completion from an injected runner", async () => {
    process.env.CODEX_MODEL = "gpt-test";
    const client = createCodexCliModelClient(async (prompt, model) => {
      expect(prompt).toContain("Role: Test Role");
      expect(model).toBe("gpt-test");
      return {
        output: "done",
        usage: { input_tokens: 20, output_tokens: 4, total_tokens: 24 },
        stderr: ""
      };
    });

    const events: CompletionEvent[] = [];
    for await (const event of client.streamCompletion({
      role: "simpleWriter",
      label: "Test Role",
      systemPrompt: "Answer directly.",
      userPrompt: "Task: say done"
    })) {
      events.push(event);
    }

    expect(events.at(-1)).toEqual({
      type: "done",
      output: "done",
      usage: { inputTokens: 20, outputTokens: 4, totalTokens: 24 }
    });
  });
});

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }
  process.env[name] = value;
}
