import { spawn } from "node:child_process";
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
  model?: string;
  streamCompletion(request: CompletionRequest): AsyncGenerator<CompletionEvent>;
}

type ModelProvider = "openai" | "codex";

interface CodexExecUsage {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
}

interface CodexExecResult {
  output: string;
  usage?: CodexExecUsage;
  stderr: string;
}

type CodexRunner = (prompt: string, model: string) => Promise<CodexExecResult>;

export function createModelClient(): ModelClient {
  if (process.env.TOKEN_CALORIMETER_TEST_MODE === "1") {
    return createDeterministicModelClient();
  }

  const provider = resolveModelProvider();
  if (provider === "codex") {
    return createCodexCliModelClient();
  }

  return createOpenAIModelClient();
}

function resolveModelProvider(): ModelProvider {
  const configured = process.env.TOKEN_CALORIMETER_PROVIDER?.trim().toLowerCase();
  if (configured === "openai" || configured === "codex") return configured;
  if (configured) {
    throw new Error("Invalid TOKEN_CALORIMETER_PROVIDER. Use 'codex' or 'openai'.");
  }
  return process.env.OPENAI_API_KEY ? "openai" : "codex";
}

function createOpenAIModelClient(): ModelClient {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing OPENAI_API_KEY for TOKEN_CALORIMETER_PROVIDER=openai. Set OPENAI_API_KEY or use TOKEN_CALORIMETER_PROVIDER=codex."
    );
  }

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  return {
    model,
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

export function createCodexCliModelClient(runCodex: CodexRunner = runCodexExec): ModelClient {
  const model = process.env.CODEX_MODEL || process.env.OPENAI_MODEL || "gpt-5.4-mini";

  return {
    model,
    async *streamCompletion(request) {
      const result = await runCodex(buildCodexPrompt(request), model);
      const output = result.output.trim();
      for (const chunk of chunkText(output)) {
        yield { type: "chunk", text: chunk };
      }
      const inputTokens =
        result.usage?.input_tokens ?? Math.max(1, Math.ceil((request.systemPrompt.length + request.userPrompt.length) / 4));
      const outputTokens = result.usage?.output_tokens ?? Math.max(1, Math.ceil(output.length / 4));
      yield {
        type: "done",
        output,
        usage: {
          inputTokens,
          outputTokens,
          totalTokens: result.usage?.total_tokens ?? inputTokens + outputTokens
        }
      };
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

function buildCodexPrompt(request: CompletionRequest): string {
  return [
    "You are being used as a single model call inside Token Calorimeter.",
    "Follow the role instructions below and return only that role's answer.",
    "Do not inspect files, run commands, mention Codex, or add commentary about this wrapper.",
    "",
    `Role: ${request.label}`,
    `Role instructions: ${request.systemPrompt}`,
    "",
    request.userPrompt
  ].join("\n");
}

function runCodexExec(prompt: string, model: string): Promise<CodexExecResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "codex",
      [
        "exec",
        "--json",
        "--ephemeral",
        "--ignore-rules",
        "--ignore-user-config",
        "--skip-git-repo-check",
        "--model",
        model,
        "--sandbox",
        "read-only",
        "-"
      ],
      { stdio: ["pipe", "pipe", "pipe"] }
    );

    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      reject(new Error(`Codex CLI failed to start. Is the 'codex' command installed and authenticated? ${error.message}`));
    });
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Codex CLI exited with code ${code}. ${stderr || stdout}`.trim()));
        return;
      }
      try {
        resolve(parseCodexJsonl(stdout, stderr));
      } catch (error) {
        reject(error);
      }
    });
    child.stdin.end(prompt);
  });
}

export function parseCodexJsonl(stdout: string, stderr = ""): CodexExecResult {
  let output = "";
  let usage: CodexExecUsage | undefined;
  for (const line of stdout.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.startsWith("{")) continue;
    const event = JSON.parse(trimmed) as {
      type?: string;
      item?: { type?: string; text?: string };
      usage?: CodexExecUsage;
    };
    if (event.type === "item.completed" && event.item?.type === "agent_message") {
      output = event.item.text ?? output;
    }
    if (event.type === "turn.completed") {
      usage = event.usage;
    }
  }
  if (!output) {
    throw new Error(`Codex CLI completed without an agent message. ${stderr || stdout}`.trim());
  }
  return { output, usage, stderr };
}

function chunkText(text: string): string[] {
  const chunks = text.match(/.{1,24}(\s|$)|\S+/g);
  return chunks?.filter(Boolean) ?? [text];
}

function deterministicText(role: AgentRole): string {
  const lines: Record<AgentRole, string> = {
    planner: "Plan: identify recipient, lateness, brevity, and delivery channel before drafting.",
    contextResearcher: "Context: this is a low-risk friend message with no need for external research.",
    toneAnalyst: "Tone: casual, apologetic enough, direct, and not over-explained.",
    riskReviewer: "Risks: sounding dramatic or formal would make a tiny delay feel larger than it is.",
    finalWriter: "Hey, sorry, I'm running about 10 minutes late. See you soon.",
    verifier: "Verified: the message is concise, friendly, and says the delay clearly.",
    simplifier:
      '{"removedRoles":["planner","contextResearcher","riskReviewer","verifier"],"reason":"The task has low ambiguity, low risk, and no external dependency. The useful work is the final sentence, not the ceremony around it.","expectedSavingsPercent":68,"recommendedWorkflow":"One direct model call with a concise human tone instruction.","removedReasons":{"planner":"The task is already one step.","contextResearcher":"The needed context is inside the sentence.","riskReviewer":"The social risk is low and obvious.","verifier":"A direct concise response is easy to inspect."}}',
    simpleWriter: "Hey, sorry, I'm running about 10 minutes late. See you soon."
  };
  return lines[role];
}
