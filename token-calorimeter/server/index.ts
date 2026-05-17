import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { z } from "zod";
import { runSimpleWorkflow, runSimplifyWorkflow, runSwarmWorkflow } from "./agentWorkflow";
import { createModelClient } from "./openaiClient";
import { closeSse, setSseHeaders, writeSseEvent } from "./sse";
import type { WorkflowEvent } from "./types";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 8787);
const agentRoleSchema = z.enum([
  "planner",
  "contextResearcher",
  "toneAnalyst",
  "riskReviewer",
  "finalWriter",
  "verifier",
  "simplifier",
  "simpleWriter"
]);
const metricsSchema = z.object({
  inputTokens: z.number().nonnegative(),
  outputTokens: z.number().nonnegative(),
  totalTokens: z.number().nonnegative(),
  estimatedCostUsd: z.number().nonnegative(),
  elapsedMs: z.number().nonnegative()
});
const agentTraceSchema = z.object({
  id: z.string().min(1),
  role: agentRoleSchema,
  label: z.string().min(1),
  status: z.enum(["queued", "running", "done", "error"]),
  promptSummary: z.string(),
  output: z.string(),
  metrics: metricsSchema,
  startedAt: z.number(),
  endedAt: z.number().optional()
});
const runSchema = z.object({ task: z.string().trim().min(1) });
const simplifySchema = z.object({
  task: z.string().trim().min(1),
  swarmTrace: z.array(agentTraceSchema)
});

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/run/swarm", (req, res) => {
  streamWorkflow(res, async (emit) => {
    const { task } = runSchema.parse(req.body);
    console.info("[token-calorimeter] run start", { mode: "swarm" });
    await runSwarmWorkflow(task, createModelClient(), emit);
  });
});

app.post("/api/run/simple", (req, res) => {
  streamWorkflow(res, async (emit) => {
    const { task } = runSchema.parse(req.body);
    console.info("[token-calorimeter] run start", { mode: "simple" });
    await runSimpleWorkflow(task, createModelClient(), emit);
  });
});

app.post("/api/run/simplify", (req, res) => {
  streamWorkflow(res, async (emit) => {
    const { task, swarmTrace } = simplifySchema.parse(req.body);
    console.info("[token-calorimeter] run start", { mode: "simplified" });
    await runSimplifyWorkflow(task, swarmTrace, createModelClient(), emit);
  });
});

function streamWorkflow(res: express.Response, workflow: (emit: (event: WorkflowEvent) => void) => Promise<void>): void {
  setSseHeaders(res);
  let closed = false;
  res.on("close", () => {
    closed = true;
  });

  const emit = (event: WorkflowEvent) => {
    if (!closed && !res.writableEnded) writeSseEvent(res, event);
  };

  workflow(emit)
    .catch((error) => {
      console.error("[token-calorimeter] run error", error);
      emit({
        type: "error",
        message: friendlyErrorMessage(error),
        details: process.env.NODE_ENV === "production" ? undefined : errorDetails(error)
      });
    })
    .finally(() => {
      closeSse(res);
    });
}

function friendlyErrorMessage(error: unknown): string {
  if (error instanceof z.ZodError) return "The task payload was invalid.";
  if (error instanceof Error) return error.message;
  return "The calorimeter run failed.";
}

function errorDetails(error: unknown): string | undefined {
  const typed = error as Error & { details?: string };
  if (typed?.details) return typed.details;
  if (error instanceof z.ZodError) return error.issues.map((issue) => issue.message).join("; ");
  if (error instanceof Error) return error.stack || error.message;
  return String(error);
}

app.listen(port, () => {
  console.info(`[token-calorimeter] server listening on http://localhost:${port}`);
});
