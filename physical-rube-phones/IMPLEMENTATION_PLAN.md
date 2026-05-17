# Agent Rube Rally Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use ultrapowers:subagent-driven-development (recommended) or ultrapowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished hackathon demo where four agent lanes race through an on-screen Rube Goldberg machine while four paired teammate phones vibrate in response to each agent's live event stream.

**Architecture:** A local Vite React app serves two surfaces from one codebase: the big-screen race board and the phone controller. A small Node server owns race state, WebSocket connections, phone pairing, event sequencing, haptic dispatch, and an optional command-driven agent runner so the animation and phones respond to named race events.

**Tech Stack:** Vite, React, TypeScript, CSS modules or plain CSS, Node HTTP server, WebSocket, QR code rendering, browser Vibration API with explicit iOS unsupported state, and Playwright/Vitest for verification.

**North Star Product:** A tactile observability harness for autonomous agent work: humans can see, feel, replay, and compare agent planning, tool use, failures, recovery, and verification across multiple agents.

**Current Milestone:** A complete local hackathon demo that runs on a laptop, lets four phones join by QR/link, shows a visually memorable four-lane Rube Goldberg race, vibrates phones for agent events when supported, and declares a winner only after a verification event.

**Future Product Direction:** Real benchmark adapters, Codex/OmniHarness integration, replayable telemetry sessions, richer haptic profiles, team tournaments, persistent leaderboards, and post-race trace analysis. These are product context only and are not part of the current implementation checklist.

**Final Functionality Standard:** The demo must work end-to-end on a local network without fake UI-only progress: race state comes from the server event model, every visible lane transition corresponds to a typed event, phones receive the same event stream as the big screen, and victory requires `verification.passed`.

---

## Product Framing

**Demo title:** Agent Rube Rally

**One-line pitch:** "We turned invisible agent execution into a race you can see and feel."

**Judging fit:**

- Live demo: four phones join, buzz, and react while the big screen animates the race.
- Creativity: agent telemetry becomes a theatrical Rube Goldberg machine and haptic game.
- Impact: the project demonstrates a human-readable control plane for long-running agent work, not just a party trick.

**Important constraint:** There is no physical Rube Goldberg component. The Rube Goldberg machine is the on-screen visual metaphor. Phones are the only physical/tactile output.

## User Stories

- As a presenter, I can open the big-screen race board and start/reset a four-agent race quickly.
- As a teammate, I can join from my phone using a QR code or short URL and bind to one agent lane.
- As a judge, I can understand that planning, tool calls, failures, recovery, and verification are real named events because they appear in the race log and drive both animation and haptics.
- As a phone participant, I can test whether haptics work before the race starts and see a clear unsupported message if my browser/device cannot vibrate.
- As a presenter, I can run a deterministic demo sequence that includes one failure-and-recovery moment so the concept lands reliably in a short judging window.
- As a developer, I can optionally wire each lane to a real command process that emits events, while the core demo remains stable and inspectable.

## State Model

Server-owned state:

- `RaceSession`: session id, status (`lobby`, `countdown`, `running`, `finished`), start time, finish time, winner lane id.
- `Lane`: id, color, label, assigned phone connection id, current stage, progress, score, event history, verification status.
- `PhoneClient`: connection id, lane id, connected/disconnected state, user agent, haptics support probe result.
- `RaceEvent`: id, timestamp, lane id, type, label, progress delta, haptic pattern id, animation cue, severity.
- `RunnerConfig`: deterministic demo mode or command runner mode, lane command definitions, timeout settings.

Client-owned ephemeral state:

- Big-screen viewport measurements, animation interpolation, hover/focus state.
- Phone wake-lock request state, last haptic result, local join form text.

Persistence:

- No database is required for the current milestone.
- Race state is in memory and resettable.
- Optional local JSON config can define lane labels, event sequence, and command runner settings.

## Event Types

Required named events:

- `race.created`
- `phone.connected`
- `phone.assigned`
- `phone.haptics_tested`
- `race.countdown_started`
- `agent.started`
- `agent.planned`
- `agent.tool_called`
- `agent.tool_completed`
- `agent.failed`
- `agent.recovered`
- `verification.started`
- `verification.failed`
- `verification.passed`
- `agent.finished`
- `race.finished`
- `race.reset`
- `error.surfaced`

Every server-emitted event must have a monotonically increasing `id` so browser clients can ignore duplicates and render a stable log.

## Haptic Patterns

Use named patterns so the server sends intent, not raw UI copy:

- `start`: short double pulse.
- `plan`: soft single pulse.
- `tool`: quick tick sequence.
- `failure`: long-short-long warning.
- `recovery`: rising three-pulse sequence.
- `verify`: steady heartbeat.
- `win`: celebratory repeated pulse.

Browser support:

- Android Chrome should use `navigator.vibrate(pattern)`.
- iOS Safari usually will not support browser vibration. The phone view must show a clear "visual pulse only" state and still flash the lane color in sync with events.
- Haptic failure must not break the race; it is surfaced as device capability status, not hidden.

## File Map

Create:

- `/Users/masterman/NLP/ralphathon/rube-phones/package.json`  
  Scripts for dev, build, test, preview, and server start.

- `/Users/masterman/NLP/ralphathon/rube-phones/pnpm-lock.yaml`  
  Generated by dependency install.

- `/Users/masterman/NLP/ralphathon/rube-phones/index.html`  
  Vite entry document.

- `/Users/masterman/NLP/ralphathon/rube-phones/tsconfig.json`  
  TypeScript configuration.

- `/Users/masterman/NLP/ralphathon/rube-phones/vite.config.ts`  
  Vite config with React plugin and dev proxy to the local event server if needed.

- `/Users/masterman/NLP/ralphathon/rube-phones/src/main.tsx`  
  React entry point.

- `/Users/masterman/NLP/ralphathon/rube-phones/src/App.tsx`  
  Route switch between screen view and phone view based on path/query.

- `/Users/masterman/NLP/ralphathon/rube-phones/src/styles.css`  
  Global visual system, responsive layout, race board styling, phone styling, animation variables.

- `/Users/masterman/NLP/ralphathon/rube-phones/src/state/RaceManager.ts`  
  Client-side manager for subscribed race snapshots, connection state, and narrow selector subscriptions.

- `/Users/masterman/NLP/ralphathon/rube-phones/src/state/HapticsManager.ts`  
  Phone haptic support probing, vibration execution, visual pulse fallback state, and test command.

- `/Users/masterman/NLP/ralphathon/rube-phones/src/net/RaceSocket.ts`  
  WebSocket client wrapper with reconnect and typed message handling.

- `/Users/masterman/NLP/ralphathon/rube-phones/src/components/ScreenRace.tsx`  
  Big-screen race board, QR join panel, lane status, start/reset controls, and event log.

- `/Users/masterman/NLP/ralphathon/rube-phones/src/components/PhoneController.tsx`  
  Phone pairing, lane assignment, haptics test, current event display, and full-screen color pulse.

- `/Users/masterman/NLP/ralphathon/rube-phones/src/components/RubeMachine.tsx`  
  Four-lane on-screen Rube Goldberg animation driven by lane stages and event cues.

- `/Users/masterman/NLP/ralphathon/rube-phones/src/components/RaceControls.tsx`  
  Presenter controls for start, reset, deterministic demo sequence, and optional command runner mode.

- `/Users/masterman/NLP/ralphathon/rube-phones/src/components/EventLog.tsx`  
  Inspectable log that proves animation and haptics are driven by typed events.

- `/Users/masterman/NLP/ralphathon/rube-phones/src/shared/types.ts`  
  Shared TypeScript types for race state, events, lanes, messages, haptic pattern ids.

- `/Users/masterman/NLP/ralphathon/rube-phones/src/shared/raceConfig.ts`  
  Lane colors, labels, stage definitions, haptic mappings, and deterministic demo script.

- `/Users/masterman/NLP/ralphathon/rube-phones/server/index.ts`  
  Node HTTP/WebSocket server, static app serving in production mode, race session lifecycle.

- `/Users/masterman/NLP/ralphathon/rube-phones/server/RaceStore.ts`  
  Server-side single source of truth for sessions, lanes, clients, and events.

- `/Users/masterman/NLP/ralphathon/rube-phones/server/DemoConductor.ts`  
  Deterministic event sequencer for the judging demo, including failure and recovery.

- `/Users/masterman/NLP/ralphathon/rube-phones/server/CommandRunner.ts`  
  Optional adapter that runs configured commands and maps structured stdout lines into `RaceEvent`s.

- `/Users/masterman/NLP/ralphathon/rube-phones/server/messages.ts`  
  Runtime validation helpers for client/server messages.

- `/Users/masterman/NLP/ralphathon/rube-phones/tests/race-store.test.ts`  
  Unit tests for race lifecycle, phone assignment, event ids, verification-gated winner logic.

- `/Users/masterman/NLP/ralphathon/rube-phones/tests/haptics-manager.test.ts`  
  Unit tests for haptic support detection and pattern dispatch behavior.

- `/Users/masterman/NLP/ralphathon/rube-phones/tests/e2e/race-demo.spec.ts`  
  Playwright test for screen view plus simulated phone clients.

- `/Users/masterman/NLP/ralphathon/rube-phones/README.md`  
  Setup, local network usage, demo script, device support notes, troubleshooting.

- `/Users/masterman/NLP/ralphathon/rube-phones/.gitignore`  
  Ignore dependencies, build output, logs, local env files, coverage, temporary artifacts.

Modify:

- No existing project files should be modified unless implementation discovers a shared root config requirement. Do not touch `/Users/masterman/NLP/ralphathon/token-calorimeter`.

## UI Direction

Visual style:

- Industrial arcade control room: dark graphite background, high-contrast lane colors, crisp mechanical outlines, lit status panels, restrained glow only on active machine elements.
- The first viewport is the race itself, not a landing page.
- The big screen should read instantly from across a room: four colored lanes, join QR, start control, visible event log, and finish gate.
- The Rube Goldberg machine should be SVG/CSS-driven for speed and reliability: ramps, marbles, levers, gates, bells, sparks, and verification locks.

Phone view:

- One lane color dominates the screen once assigned.
- Large status text: lane name, current event, haptic support, connected state.
- One obvious haptic test button before the race.
- During events, the entire phone screen pulses even if vibration is unsupported.

## Implementation Tasks

- [x] Create the project scaffold in `/Users/masterman/NLP/ralphathon/rube-phones` with Vite, React, TypeScript, Node server scripts, `.gitignore`, and initial README.
  - Verification: `pnpm install`, `pnpm build`, and `pnpm test` run without missing script errors.

- [x] Define shared race types and config in `src/shared/types.ts` and `src/shared/raceConfig.ts`.
  - Include all required event names, haptic pattern ids, lane definitions, stage definitions, and deterministic demo script.
  - Verification: typecheck catches invalid event names or haptic ids.

- [x] Implement server race state in `server/RaceStore.ts`.
  - Support session reset, phone connect/disconnect, lane assignment, event append, progress updates, verification status, and winner selection only after `verification.passed`.
  - Verification: `tests/race-store.test.ts` proves event ids are monotonic, phones bind to lanes, reset clears state, and unverified finish cannot win.

- [x] Implement WebSocket server in `server/index.ts` and typed message validation in `server/messages.ts`.
  - Message families: client hello, join lane, haptics result, presenter start, presenter reset, server snapshot, server event, server error.
  - Verification: unit tests for invalid messages and manual smoke test with two browser tabs.

- [x] Implement deterministic race conductor in `server/DemoConductor.ts`.
  - Drive all four lanes through a short, judge-friendly event sequence.
  - Include one lane failure, surfaced error, recovery event, verification retry, and later pass.
  - Ensure no lane wins before verification.
  - Verification: test conductor emits the expected ordered terminal events.

- [x] Implement optional command runner in `server/CommandRunner.ts`.
  - Accept configured commands that emit JSON lines with event names and lane ids.
  - Convert structured stdout into race events.
  - Surface malformed lines as `error.surfaced` instead of crashing silently.
  - Verification: test a small local command fixture that emits valid and invalid lines.

- [x] Implement client `RaceSocket` and `RaceManager`.
  - Centralize snapshots, events, connection state, and presenter commands in managers.
  - Provide narrow subscription helpers so high-frequency event updates do not repaint unrelated UI.
  - Verification: component tests or unit tests prove subscribers receive only relevant updates.

- [x] Implement `HapticsManager`.
  - Probe browser support, expose support status, run named patterns, and provide visual pulse fallback state.
  - Do not assume vibration success; report unsupported devices clearly.
  - Verification: tests stub `navigator.vibrate` for supported, unsupported, and failed-call cases.

- [x] Build `ScreenRace.tsx`, `RaceControls.tsx`, `RubeMachine.tsx`, and `EventLog.tsx`.
  - The big-screen route must display the race board immediately.
  - Start/reset controls must send presenter commands to the server.
  - QR/link must point phones to `/phone?session=<id>`.
  - Event log must show typed events in real time.
  - Verification: Playwright confirms the screen route renders lanes, QR/link, controls, and log.

- [x] Build `PhoneController.tsx`.
  - Phone route must connect, allow lane selection or auto-assignment, test haptics, show support state, and pulse on events.
  - Verification: Playwright with multiple browser contexts confirms phone clients join lanes and receive event updates.

- [x] Polish responsive design and animation in `src/styles.css`.
  - Desktop: optimized for projector/laptop full-screen.
  - Mobile: touch-friendly, no clipped text, no overlapping controls, visible connection/haptics state.
  - Verification: Playwright screenshots at desktop and phone viewport sizes.

- [x] Write README demo instructions.
  - Include local network start command, how to find laptop IP, QR/phone setup, Android/iOS haptic caveats, and the 3-minute judging script.
  - Verification: follow README on the local machine and confirm a phone can load the page over LAN.

- [x] Add deterministic and browser verification scripts.
  - `pnpm test`: unit tests.
  - `pnpm build`: production build.
  - `pnpm dev`: app plus server for local demo.
  - `pnpm test:e2e`: Playwright route and event-flow smoke test.
  - Verification: all commands pass before demo handoff.

## Acceptance Criteria

- Big screen opens to a four-lane Rube Goldberg race board.
- Phone clients join by QR/link and bind to lanes.
- At least four browser clients can connect at once: one screen plus four phones.
- Each named agent event updates the big-screen machine, event log, and assigned phone.
- Supported phones vibrate with distinct patterns.
- Unsupported phones show clear support status and still pulse visually.
- A lane cannot win without a `verification.passed` event.
- The deterministic demo sequence includes start, planning, tool call, failure, recovery, verification, and winner moments.
- Reset returns all clients to a clean lobby/race-ready state.
- The README contains a presenter script that can be followed under hackathon time pressure.

## Testing Strategy

Deterministic tests:

- `RaceStore` lifecycle and winner logic.
- Message validation.
- Demo conductor event order.
- Haptic support and pattern dispatch.
- Command runner JSON-line parsing.

Browser tests:

- Screen route renders controls, lanes, QR/link, and event log.
- Phone route joins a lane and receives events.
- Race start drives visible lane progress.
- Failure and recovery states appear in the log and lane.
- Winner appears only after verification passes.

Manual device tests:

- Android Chrome haptic test.
- iPhone Safari unsupported/visual pulse test.
- Four phones connected on the same Wi-Fi.
- Projector/full-screen readability from several feet away.

Approval-gated agentic journey test candidate:

- Mission: "Can a first-time judge understand the race state without explanation?"
- Entry point: open screen route, join one simulated phone, start demo.
- Expected visible proof: lane labels, animated progress, haptic/support state, event log, verification-gated winner.
- Gate: run only if the presenter wants a black-box UX pass after implementation.

## Operational Notes

- Use the already-running process if one exists during testing; otherwise start one local dev server for this app.
- Do not create branches or worktrees.
- Do not delete files.
- Keep generated artifacts out of versioned files via `.gitignore`.
- Prefer stable local network behavior over dependency-heavy visual effects.
- Keep the server logs useful: race start/reset, client joins, event append, surfaced errors, and finish.

## Demo Script

1. Open the big-screen route and show the four lanes.
2. Have four teammates scan the QR code or open the phone URL.
3. Tap haptic test on one Android device and point out iPhone visual fallback if needed.
4. Say: "Each lane is an agent. The machine moves only when the agent emits real events."
5. Start the race.
6. Let the failure lane buzz harshly and fall into the recovery chute.
7. Point to the event log: planning, tool call, failure, recovery, verification.
8. Let the verified winner cross the finish gate.
9. Close with: "The race is fun, but the real project is tactile observability for autonomous agents."

## Self-Review

- The plan creates an isolated project folder requested by the user and does not require branches or worktrees.
- The current milestone is complete for a hackathon demo and does not rely on a physical Rube Goldberg component.
- The Rube Goldberg machine is implemented as an on-screen animation driven by typed events.
- Phone vibration is treated as capability-dependent with a visible fallback state, not silently assumed.
- Victory is verification-gated.
- The plan includes deterministic tests, browser tests, and manual phone checks.
- Optional command runner support is included without making it a blocker for the deterministic judging demo.
