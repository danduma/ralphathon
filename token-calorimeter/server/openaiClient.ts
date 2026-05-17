import OpenAI from "openai";
import type { AgentRole } from "./types";
import type { CompletionEvent } from "./types";

export interface CompletionRequest {
  role: AgentRole;
  label: string;
  systemPrompt: string;
  userPrompt: string;
}

export interface ModelClient {
  streamCompletion(request: CompletionRequest): AsyncGenerator<CompletionEvent>;
}

export function createModelClient(): ModelClient {
  if (process.env.TOKEN_CALORIMETER_TEST_MODE === "1") {
    return createDeterministicModelClient();
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY. Add it to the server environment or copy .env.example to .env.");
  }

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  return {
    async *streamCompletion(request) {
      const stream = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: request.systemPrompt },
          { role: "user", content: request.userPrompt }
        ],
        temperature: 0.5,
        stream: true,
        stream_options: { include_usage: true }
      });

      let output = "";
      let usage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };

      for await (const part of stream) {
        const text = part.choices[0]?.delta?.content ?? "";
        if (text) {
          output += text;
          yield { type: "chunk", text };
        }
        if (part.usage) {
          usage = {
            inputTokens: part.usage.prompt_tokens ?? 0,
            outputTokens: part.usage.completion_tokens ?? 0,
            totalTokens: part.usage.total_tokens ?? 0
          };
        }
      }

      if (usage.totalTokens === 0) {
        const estimatedOutput = Math.max(1, Math.ceil(output.length / 4));
        usage = {
          inputTokens: Math.max(1, Math.ceil((request.systemPrompt.length + request.userPrompt.length) / 4)),
          outputTokens: estimatedOutput,
          totalTokens: estimatedOutput + Math.max(1, Math.ceil((request.systemPrompt.length + request.userPrompt.length) / 4))
        };
      }

      yield { type: "done", output, usage };
    }
  };
}

export function createDeterministicModelClient(): ModelClient {
  return {
    async *streamCompletion(request) {
      const text = deterministicText(request.role);
      const words = text.split(/(\s+)/).filter(Boolean);
      for (const word of words) {
        await new Promise((resolve) => setTimeout(resolve, 12));
        yield { type: "chunk", text: word };
      }
      const inputTokens = Math.max(8, Math.ceil((request.systemPrompt.length + request.userPrompt.length) / 8));
      const outputTokens = Math.max(4, Math.ceil(text.length / 5));
      yield {
        type: "done",
        output: text,
        usage: {
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens
        }
      };
    }
  };
}

function deterministicText(role: AgentRole): string {
  const lines: Record<AgentRole, string> = {
    planner: "Plan: identify recipient, lateness, brevity, and delivery channel before drafting.",
    contextResearcher: "Context: this is a low-risk friend message with no need for external research.",
    toneAnalyst: "Tone: casual, apologetic enough, direct, and not over-explained.",
    riskReviewer: "Risks: sounding dramatic or formal would make a tiny delay feel larger than it is.",
    finalWriter: "Hey, sorry, I'm running about 10 minutes late. See you soon.",
    verifier: "Verified: the message is concise, friendly, and says the delay clearly.",
    simpleWriter: "Hey, sorry, I'm running about 10 minutes late. See you soon."
  };
  return lines[role];
}
