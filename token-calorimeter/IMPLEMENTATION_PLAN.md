# The Token Calorimeter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `ultrapowers:subagent-driven-development` or `ultrapowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a live web app that shows how absurdly wasteful over-agentic workflows can be by turning token generation into rising fire inside a Rube Goldberg machine.

**Architecture:** A React/Vite frontend renders the theatrical calorimeter, task console, agent trace, comparison receipt, and simplification flow. A local Node/Express backend owns all OpenAI calls, streams run events to the browser over SSE, tracks real token usage, and computes cost/latency metrics.

**Tech Stack:** Vite, React, TypeScript, Tailwind CSS, Framer Motion, SVG or Canvas animation, Express, OpenAI API, Server-Sent Events, Vitest, Playwright.

**North Star Product:** An over-agenting detector that helps builders see when a task deserves an agentic workflow and when it should be a direct prompt, deterministic function, or simple script.

**Current Milestone:** A polished 3-minute Ralphthon demo with real OpenAI calls, real token accounting, animated token burn, multi-agent traces, simplification recommendations, and a clear final receipt.

**Future Product Direction:** A developer tool that ingests real agent traces from coding agents, CI jobs, or production systems, then recommends cheaper, simpler, more reliable workflow shapes.

**Final Functionality Standard:** The app must run end to end locally, call the model through the backend, stream visible progress into the UI, compare swarm and simple runs, show real metrics, survive common errors, and make the core story legible in under 15 seconds.

---

## Product Premise

The Token Calorimeter is a tiny piece of product theater:

> A tiny task enters. A furnace of agents wakes up.

The app is not anti-AI. It argues that AI needs taste. The memorable object is a live Rube Goldberg machine where every generated token becomes fuel. The joke lands first: a whole agent swarm works very hard to produce an ordinary text message. Then the product insight lands: many agent workflows can be simplified without losing the outcome.

Do not build a generic dashboard. The app should feel like a science museum exhibit for AI builders.

## Demo Script

1. Open the app.
2. Select the preset task: "Tell my friend I'll be 10 minutes late."
3. Click **Ignite**.
4. Narrate the agent swarm: planner, context researcher, tone analyst, risk reviewer, final writer, verifier.
5. Point to token particles feeding the furnace and the flame rising.
6. Show the final output.
7. Click **Simplify**.
8. Show unnecessary agents removed and the simpler path rerun.
9. Close with: "Same message. Smaller fire."

Optional spoken pitch:

> Everyone here is learning how to make agents do more. We built the opposite question: when should an agent do less?
>
> Here is a tiny human task: telling a friend I'll be ten minutes late.
>
> First, we run it through the modern agent cathedral: planner, context researcher, tone analyst, risk reviewer, final writer, verifier. Every token becomes fuel. You can literally watch the fire rise.
>
> Now here is the same task with a human-sized workflow.
>
> Same message. Smaller fire.
>
> The product version is an over-agenting detector. It reads your agent trace, identifies unnecessary reasoning, and recommends the simpler workflow. Because AI should amplify human intent, not bury it under machinery.

## Scope Notes

- Build a real local app, not slides.
- Use real OpenAI calls in normal operation.
- Do not expose API keys in the browser.
- Do not make exact carbon or CO2 claims unless adding a sourced, defensible methodology. For this milestone, use tokens, cost, latency, and "compute heat" as the truthful metrics.
- Do not use canned fake results as the final demo.
- It is acceptable to include a deterministic test mode for automated tests, but the primary product path must use real model calls.
- Do not create a branch.
- Do not create a worktree.
- Do not delete files.

## User Stories

### Primary Judge Story

As a hackathon judge, I want to understand the project in under 15 seconds, see a live demo that actually works, and leave remembering the image of tokens feeding a fire.

### Builder Story

As an AI builder, I want to see how many steps and tokens a multi-agent workflow uses for a tiny task, so I can recognize when I am over-engineering.

### Simplification Story

As an AI builder, I want the app to identify unnecessary agents and show a simpler workflow, so the project feels useful rather than just satirical.

### Failure/Recovery Story

As a presenter, I want model/API errors to appear clearly with a retry path, so a failed call does not silently kill the demo.

### Return/Revisit Story

As a user reopening the app, I want the preset tasks and the last successful receipt to be visible enough that I can quickly rerun or explain the demo.

## Main User Flow

1. User opens the app.
2. User sees a dramatic split-screen machine: **Agent Swarm** vs **Human-Sized Mode**.
3. User picks or types a tiny task:
   - "Tell my friend I'll be 10 minutes late."
   - "Write a polite apology for missing dinner."
   - "Summarize this meeting in one sentence."
   - "Rename this file to something clearer."
4. User clicks **Ignite**.
5. Agent Swarm mode runs multiple model calls:
   - Planner
   - Context Researcher
   - Tone Analyst
   - Risk Reviewer
   - Final Writer
   - Verifier
6. Each response streams tokens or chunks. Every streamed token/chunk increases:
   - flame height
   - token counter
   - cost counter
   - elapsed time
   - machine movement
7. Human-Sized mode runs one direct model call.
8. The app compares outputs.
9. User clicks **Simplify**.
10. The app shows which agents were unnecessary and why.
11. The app reruns the simpler path.
12. Final receipt appears:
   - tokens burned
   - estimated cost
   - latency
   - unnecessary steps
   - simpler alternative
   - final line: "Same message. Smaller fire."

## Product Surfaces

### Task Console

Responsibilities:

- Show product title and concise premise.
- Provide preset task buttons.
- Provide custom task input.
- Provide **Ignite**, **Simplify**, **Reset**, and **Retry** actions.
- Show current run status.

Required visible copy:

- "The Token Calorimeter"
- "A tiny task enters. A furnace of agents wakes up."
- "Same answer. Smaller fire."

### Calorimeter Stage

Responsibilities:

- Render the Rube Goldberg machine.
- Show agent stations in a visually overbuilt sequence.
- Animate token particles moving through pipes.
- Render a furnace/flame that responds to token burn.
- Show pressure/cost/latency gauges.
- Clearly distinguish Agent Swarm from Human-Sized Mode.

### Receipt and Trace

Responsibilities:

- Show final outputs side by side.
- Show total tokens, cost, latency, and waste ratio.
- Show per-agent trace.
- Show simplification recommendations.
- Keep the information readable in a 3-minute demo.

### Error Panel

Responsibilities:

- Show clear error messages.
- Preserve backend details in development.
- Provide retry and reset actions.
- Handle interrupted SSE streams.

## Visual Design Direction

The interface should be memorable, not generic.

Style:

- dark stage background
- warm furnace/fire colors
- brass/copper machine accents
- readable, sharp typography
- dense but not cluttered controls
- cards only for repeated items or actual panels
- 8px border radius or less
- no decorative blobs/orbs
- no one-note purple/blue SaaS palette

The Agent Swarm path should look comically overbuilt. The Human-Sized path should look clean, direct, and almost boring.

Animation elements:

- input chute
- rolling token marbles
- little gates labeled by agent role
- pipes between agents
- furnace at the end
- flame rising with token count
- pressure gauge
- cost meter
- latency stopwatch
- smoke/heat shimmer at high waste ratios

Responsive requirements:

- Desktop: stage and receipt can sit side by side.
- Tablet: stage above receipt, task console remains prominent.
- Mobile: task console first, then compact stage, then receipt/trace.
- No text overlap at 390px width.
- Buttons must keep readable labels.

## State Model

Use a single frontend manager as the source of truth for run data.

Create `src/managers/CalorimeterManager.ts`.

Manager-owned state:

- selected preset id
- task text
- run status
- active mode
- swarm traces
- simple traces
- simplified traces
- swarm result
- simple result
- simplified result
- simplification recommendation
- aggregate metrics
- latest error
- last successful receipt

Manager actions:

- `setTask(task: string)`
- `selectPreset(id: string)`
- `startComparisonRun()`
- `startSwarmRun()`
- `startSimpleRun()`
- `simplify()`
- `retry()`
- `reset()`

React components subscribe through `src/hooks/useCalorimeterSnapshot.ts`.

High-churn animation state may live inside animation components if it is purely visual and derived from manager metrics. Do not scatter source-of-truth run state across components.

## Data Types

Define shared types in `src/shared/types.ts`.

```ts
export type AgentRole =
  | "planner"
  | "contextResearcher"
  | "toneAnalyst"
  | "riskReviewer"
  | "finalWriter"
  | "verifier"
  | "simpleWriter";

export type RunMode = "swarm" | "simple" | "simplified";

export type RunStatus =
  | "idle"
  | "running"
  | "complete"
  | "simplifying"
  | "error";

export interface TokenMetrics {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  elapsedMs: number;
}

export interface AgentTrace {
  id: string;
  role: AgentRole;
  label: string;
  status: "queued" | "running" | "done" | "error";
  promptSummary: string;
  output: string;
  metrics: TokenMetrics;
  startedAt: number;
  endedAt?: number;
}

export interface RunResult {
  mode: RunMode;
  task: string;
  finalOutput: string;
  traces: AgentTrace[];
  metrics: TokenMetrics;
}

export interface SimplificationRecommendation {
  removedRoles: AgentRole[];
  reason: string;
  expectedSavingsPercent: number;
}
```

## Backend API

The backend owns all model calls and token accounting.

Endpoints:

- `GET /api/health`
  - returns `{ ok: true }`

- `POST /api/run/swarm`
  - body: `{ task: string }`
  - streams server-sent events
  - emits agent start, token chunks, agent done, totals, and final answer

- `POST /api/run/simple`
  - body: `{ task: string }`
  - streams server-sent events
  - emits token chunks, totals, and final answer

- `POST /api/run/simplify`
  - body: `{ task: string, swarmTrace: AgentTrace[] }`
  - returns or streams simplification plan and simplified run

### SSE Contract

Use JSON SSE events shaped like:

```json
{ "type": "run.started", "mode": "swarm" }
{ "type": "agent.started", "agent": { "id": "planner-1", "role": "planner" } }
{ "type": "token", "agentId": "planner-1", "text": "..." }
{ "type": "agent.done", "agentId": "planner-1", "metrics": { "totalTokens": 123 } }
{ "type": "run.done", "result": { "mode": "swarm" } }
{ "type": "error", "message": "...", "details": "..." }
```

Frontend should animate token events immediately.

### Token Accounting

Use actual usage metadata from OpenAI responses when available.

If streaming does not expose token usage until completion:

- stream visual chunks as text arrives
- estimate live flame from chunk character count
- update final token count when usage arrives
- reconcile flame and counters to actual final usage

Add a short code comment explaining that live animation is estimated until final usage arrives.

### Cost Accounting

Create `server/pricing.ts`.

Use a simple model pricing table:

```ts
interface ModelPrice {
  inputUsdPerMillion: number;
  outputUsdPerMillion: number;
}
```

Keep the table easy to update. Do not include carbon equivalents in this milestone.

## Model Workflow

### Swarm Mode

Each role should call the model separately so token usage is real.

1. **Planner**
   - Decide what steps are needed.
   - Slightly over-plan in a believable way.
   - Output a compact plan.

2. **Context Researcher**
   - Infer context from the task.
   - Do not browse.
   - Output assumptions and likely user intent.

3. **Tone Analyst**
   - Decide tone, audience, emotional stakes, and appropriate brevity.

4. **Risk Reviewer**
   - Identify risks: too cold, too long, too apologetic, unclear, too formal.

5. **Final Writer**
   - Produce the actual answer.

6. **Verifier**
   - Check whether the answer satisfies the original task.
   - Suggest tiny corrections if needed.

Compose the final answer from Final Writer plus Verifier.

### Simple Mode

One direct model call:

> Complete the user's tiny task directly. Be concise, natural, and human.

### Simplify Mode

The simplifier reads the swarm trace and identifies unnecessary agents.

It should produce:

- removed roles
- why each was unnecessary
- expected savings
- recommended workflow

Example:

> Planner, Context Researcher, Risk Reviewer, and Verifier were unnecessary because the task had low ambiguity, low risk, and no external dependencies.

## File Map

### Root Files

- `package.json`
  - scripts, dependencies, project metadata

- `vite.config.ts`
  - Vite config and dev proxy if needed

- `tsconfig.json`
  - TypeScript config

- `tailwind.config.ts`
  - Tailwind content and theme extensions

- `postcss.config.js`
  - Tailwind/PostCSS wiring

- `index.html`
  - Vite HTML entry

- `.env.example`
  - documents `OPENAI_API_KEY=`

- `.gitignore`
  - covers `.env`, `node_modules`, build outputs, coverage, logs, Playwright artifacts, temporary files

### Frontend Files

- `src/main.tsx`
  - React entry

- `src/App.tsx`
  - top-level layout

- `src/styles.css`
  - Tailwind directives and global styling

- `src/components/TaskConsole.tsx`
  - task presets, custom task input, primary actions

- `src/components/CalorimeterStage.tsx`
  - visual stage layout

- `src/components/AgentMachine.tsx`
  - Rube Goldberg agent stations and pipes

- `src/components/FlameGauge.tsx`
  - furnace, flame, smoke, pressure gauge

- `src/components/TokenParticleLayer.tsx`
  - token particle animation

- `src/components/RunReceipt.tsx`
  - final comparison and memorable close

- `src/components/AgentTracePanel.tsx`
  - per-agent trace and metrics

- `src/components/ComparisonMeters.tsx`
  - token/cost/latency/waste visual meters

- `src/components/ErrorPanel.tsx`
  - retryable error state

### State and Shared Files

- `src/managers/CalorimeterManager.ts`
  - single source of truth for app state and run lifecycle

- `src/hooks/useCalorimeterSnapshot.ts`
  - React subscription hook

- `src/shared/types.ts`
  - shared frontend types

- `src/shared/sse.ts`
  - SSE event parsing helpers

- `src/shared/presets.ts`
  - preset tiny tasks

- `src/shared/formatters.ts`
  - token/cost/time/ratio formatting

### Backend Files

- `server/index.ts`
  - Express app and route registration

- `server/openaiClient.ts`
  - OpenAI client setup and model call helpers

- `server/agentWorkflow.ts`
  - swarm, simple, and simplify workflows

- `server/pricing.ts`
  - model pricing and cost calculation

- `server/sse.ts`
  - SSE response helpers

- `server/types.ts`
  - backend event and workflow types

### Tests

- `src/shared/formatters.test.ts`
  - formatter tests

- `src/managers/CalorimeterManager.test.ts`
  - manager lifecycle tests

- `server/pricing.test.ts`
  - cost calculation tests

- `server/agentWorkflow.test.ts`
  - workflow/event-order tests with a test double model client

- `tests/e2e/token-calorimeter.spec.ts`
  - Playwright main demo flow

## Implementation Checklist

### 1. Project Setup

- [ ] Create Vite React TypeScript app structure.
- [ ] Add Tailwind.
- [ ] Add Express server.
- [ ] Add `pnpm dev` command that runs frontend and backend together.
- [ ] Add `pnpm test` for Vitest.
- [ ] Add `pnpm test:e2e` for Playwright.
- [ ] Add `.env.example` with `OPENAI_API_KEY=`.
- [ ] Add `.gitignore` coverage for `.env`, `node_modules`, build output, coverage, logs, Playwright artifacts, temporary files, and local caches.

Verification:

- [ ] `pnpm install`
- [ ] `pnpm dev`
- [ ] Frontend loads locally.
- [ ] `GET /api/health` responds with `{ ok: true }`.

### 2. Shared Types and Formatters

- [ ] Implement shared run, agent, metric, and SSE event types.
- [ ] Implement token, cost, elapsed time, and ratio formatters.
- [ ] Add unit tests for formatters.

Verification:

- [ ] `pnpm test src/shared/formatters.test.ts`

### 3. Backend OpenAI Client

- [ ] Implement API key loading from server environment.
- [ ] Implement model call helper.
- [ ] Return streamed chunks and final usage.
- [ ] Surface real errors with details in development.
- [ ] Ensure missing API key fails clearly.

Verification:

- [ ] Manual test endpoint or workflow call returns a model response.
- [ ] Missing API key produces a clear backend error.
- [ ] API key is never referenced by frontend code.

### 4. Backend SSE Helpers

- [ ] Implement SSE headers.
- [ ] Implement helper to write typed JSON events.
- [ ] Implement helper to close streams safely.
- [ ] Ensure errors are emitted before closing where possible.

Verification:

- [ ] Manual `curl -N` shows valid streamed events.
- [ ] Interrupted client connection does not crash the server.

### 5. Agent Workflow

- [ ] Implement swarm workflow with six sequential model calls.
- [ ] Implement simple workflow with one model call.
- [ ] Implement simplifier workflow.
- [ ] Track per-agent metrics.
- [ ] Track total metrics.
- [ ] Emit SSE events for run start, agent start, token, agent done, run done, and error.
- [ ] Compose final answer from actual model outputs.

Verification:

- [ ] Backend test validates event order.
- [ ] Backend test validates total tokens equal sum of agent tokens.
- [ ] Manual curl shows streaming events for swarm and simple runs.

### 6. Calorimeter Manager

- [ ] Implement centralized manager.
- [ ] Implement subscriptions.
- [ ] Implement run lifecycle:
  - idle
  - running
  - complete
  - simplifying
  - error
- [ ] Parse SSE events.
- [ ] Update traces and metrics incrementally.
- [ ] Expose stable snapshot for React.
- [ ] Store the last successful receipt in `localStorage`.
- [ ] Add reset behavior that clears current run but preserves preset tasks.

Verification:

- [ ] Unit test manager transitions.
- [ ] Unit test error state.
- [ ] Unit test reset.
- [ ] Unit test last receipt persistence.

### 7. Core UI Layout

- [ ] Build main app shell.
- [ ] Build task console.
- [ ] Build preset task selection.
- [ ] Build custom task input.
- [ ] Build Ignite, Simplify, Retry, and Reset actions.
- [ ] Build responsive layout for desktop, tablet, and mobile.
- [ ] Use concise visible copy only.

Verification:

- [ ] Page usable at 1440px, 1024px, and 390px width.
- [ ] No text overlap.
- [ ] Buttons remain readable.
- [ ] Main concept is visible in the first viewport.

### 8. Rube Goldberg Animation

- [ ] Build `AgentMachine`.
- [ ] Draw agent stations.
- [ ] Draw pipes/chutes.
- [ ] Animate token particles from station to station.
- [ ] Animate gates opening as each agent starts.
- [ ] Add machine shake at high waste ratio.
- [ ] Keep animation derived from manager state.

Verification:

- [ ] Particles move during a real streaming run.
- [ ] Animation does not resize layout.
- [ ] Stage remains readable on mobile.

### 9. Flame Gauge

- [ ] Build furnace visual.
- [ ] Map token count to flame height.
- [ ] Map waste ratio to flame color/smoke.
- [ ] Add pressure gauge.
- [ ] Add live token/cost/latency counters.

Suggested logic:

```ts
const flameIntensity = clamp(totalTokens / maxExpectedTokens, 0, 1);
const wasteRatio = swarmTokens / Math.max(simpleTokens, 1);
```

Visual mapping:

- flame height increases with total tokens
- flame color shifts yellow to orange to red
- smoke appears when waste ratio is greater than 3x
- machine shakes slightly when waste ratio is greater than 6x

Verification:

- [ ] Flame visibly rises during run.
- [ ] Flame reconciles to final token count.
- [ ] Animation remains smooth enough for demo.

### 10. Receipt and Trace

- [ ] Build side-by-side final outputs.
- [ ] Build comparison meters:
  - total tokens
  - estimated cost
  - elapsed time
  - waste ratio
- [ ] Build agent trace panel.
- [ ] Show prompt summary, output summary, and metrics per agent.
- [ ] Show final memorable line: "Same message. Smaller fire."

Verification:

- [ ] Receipt appears after runs complete.
- [ ] Trace is readable but not overwhelming.
- [ ] Metrics match backend totals.

### 11. Simplify Flow

- [ ] Add Simplify button after swarm/simple comparison.
- [ ] Call simplify endpoint.
- [ ] Show removed agents.
- [ ] Show reason each removed agent was unnecessary.
- [ ] Rerun simplified path.
- [ ] Update receipt with before/after comparison.

Verification:

- [ ] Simplify gives concrete removed roles.
- [ ] Simplified output still satisfies original task.
- [ ] Savings ratio is shown clearly.

### 12. Error Handling

- [ ] Show clear frontend error panel.
- [ ] Preserve backend error details in development.
- [ ] Allow retry.
- [ ] Allow reset.
- [ ] Handle interrupted SSE streams.
- [ ] Disable conflicting controls while a run is active.

Verification:

- [ ] Test missing API key.
- [ ] Test network interruption.
- [ ] Test model error response.
- [ ] Test retry after error.

### 13. Demo Polish

- [ ] Add keyboard-friendly controls.
- [ ] Add loading/running states.
- [ ] Add disabled states while running.
- [ ] Add crisp microcopy.
- [ ] Remove generic filler text.
- [ ] Tune colors so the product is not dominated by a single hue family.
- [ ] Make the first viewport instantly communicate the concept.

Required visible copy:

- [ ] "The Token Calorimeter"
- [ ] "A tiny task enters. A furnace of agents wakes up."
- [ ] "Same answer. Smaller fire."

### 14. Deterministic Tests

- [ ] Add formatter unit tests.
- [ ] Add pricing unit tests.
- [ ] Add manager lifecycle tests.
- [ ] Add workflow event-order tests using a test double model client.
- [ ] Add Playwright test for main demo flow.

Playwright should verify:

- [ ] page loads
- [ ] preset selected
- [ ] ignite starts run
- [ ] token counters change
- [ ] receipt appears
- [ ] simplify works

Verification:

- [ ] `pnpm test`
- [ ] `pnpm test:e2e`

### 15. Final Manual Demo Rehearsal

Run the exact 3-minute flow:

1. Open app.
2. Select "Tell my friend I'll be 10 minutes late."
3. Click Ignite.
4. Narrate the swarm.
5. Point to flame rising.
6. Show final output.
7. Click Simplify.
8. Show simpler path and savings.
9. Close with: "Same message. Smaller fire."

Acceptance:

- [ ] Demo works live without refreshing.
- [ ] Judge understands the idea in under 15 seconds.
- [ ] The flame/token visual is the memorable object.
- [ ] The app has a real product thesis, not just a joke.

## Operational Readiness

Environment:

- `OPENAI_API_KEY` must be server-only.
- Model name should be configurable with a safe default.
- If model pricing changes, update `server/pricing.ts`.

Logging:

- Log run start, run completion, total tokens, total cost, and errors server-side.
- Do not log API keys.
- Do not log excessive full prompt data unless needed for development.

Failure modes:

- Missing API key: show clear setup error.
- Rate limit: show retryable error.
- Network interruption: allow retry/reset.
- Model returns malformed simplification output: show raw explanation fallback only as an error state, not as fake success.

## Candidate Agentic User Journey Test

This is optional and requires human approval before running as an external black-box journey test.

Mission:

- Validate whether a first-time judge can understand and operate the demo without instruction.

Entry point:

- Local app URL.

Expected visible proof:

- Title and premise visible.
- Preset task can be selected.
- Ignite creates visible token/fire motion.
- Receipt appears.
- Simplify shows reduced workflow.

Approval gate:

- Ask the human before running any autonomous browser journey beyond deterministic Playwright tests.

## Self-Review Checklist

- [ ] Every requirement maps to an implementation task.
- [ ] There are no placeholder product paths.
- [ ] The app uses real model calls in normal operation.
- [ ] API key stays server-side.
- [ ] Carbon claims are avoided or sourced.
- [ ] The visual concept is clear without explanation.
- [ ] The implementation does not assume a branch or worktree.
- [ ] No files are deleted.
- [ ] Tests cover formatters, pricing, manager state, workflow events, and the main UI flow.
- [ ] The final deliverable is complete for the hackathon demo milestone.
