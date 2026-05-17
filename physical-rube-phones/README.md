# Agent Rube Rally

Agent Rube Rally is a local hackathon demo: a projector shows four agent lanes racing through an on-screen Rube Goldberg machine, while up to four teammate phones pair to lanes and receive the same typed event stream as haptic or visual pulses.

## Run The Demo

```bash
pnpm install
pnpm dev
```

Open the screen route on the laptop:

```text
http://localhost:5173
```

The Node/WebSocket event server runs on port `8787`. The Vite app connects to it automatically.

## Phone Setup On The Local Network

Find the laptop IP:

```bash
ipconfig getifaddr en0
```

If Wi-Fi is on another interface, run:

```bash
ifconfig | grep "inet "
```

Have phones scan the QR code on the screen or open:

```text
http://<laptop-ip>:5173/phone
```

Each phone can choose a lane or use auto-assign. Android Chrome should vibrate for supported haptic events. iPhone Safari normally does not expose browser vibration, so the phone controller shows `visual pulse only` and flashes the lane color in sync with the event stream.

## Presenter Script

1. Open the screen route full-screen and point out the four colored agent lanes.
2. Have four teammates open the phone URL or scan the QR code.
3. Ask one Android participant to tap `Test haptics`; point out the visual fallback on iOS.
4. Say: "Each lane is an agent. The machine moves only when the agent emits typed events."
5. Click `Start demo`.
6. Let Nova hit the failure event and recovery chute.
7. Point to the event log: planning, tool calls, failure, recovery, verification, finish.
8. Let Atlas win only after `verification.passed`.
9. Close with: "The race is fun, but the real project is tactile observability for autonomous agents."

## Commands

```bash
pnpm build
pnpm test
pnpm test:e2e
pnpm preview
```

`pnpm preview` builds the Vite app and serves it from the Node server at:

```text
http://localhost:8787
```

## Optional Command Runner

`Command mode` looks for `runner.config.json` in this folder. It is intentionally ignored by default so local command experiments do not become part of the demo by accident.

Example:

```json
{
  "timeoutMs": 30000,
  "commands": [
    {
      "laneId": "lane-1",
      "command": "node",
      "args": ["./scripts/example-agent.js"]
    }
  ]
}
```

Each command must emit JSON lines:

```json
{"laneId":"lane-1","type":"agent.started","label":"Agent started","progressDelta":10}
```

Malformed lines become `error.surfaced` events instead of silently crashing the race. If you wire this to the locally authenticated Codex CLI, call the installed `codex` command from the config; do not copy auth files or tokens into this project.

## Deployment Note

When deploying from this workstation, use the existing deployment helper at `/Users/masterman/NLP/trendintel/devops/rag1_ssh.sh` if it is available. Treat that helper and its referenced SSH key material as local credentials only: do not copy them into this project, do not print their contents, and do not commit them. This repository ignores local SSH helpers, private keys, `.env` files, and `runner.config.json`.

## Verification Notes

- Race state is owned by the server and sent to all clients over WebSocket.
- Every lane movement is driven by a typed `RaceEvent`.
- Phones receive the same events as the big screen.
- A lane cannot become the winner until it emits `verification.passed` and then `agent.finished`.
- `race.reset` returns the board to a clean lobby state.
