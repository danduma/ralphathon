import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { createReadStream, existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { WebSocketServer, type WebSocket } from "ws";
import { CommandRunner } from "./CommandRunner";
import { DemoConductor } from "./DemoConductor";
import { parseClientMessage } from "./messages";
import { buildJoinUrlResponse } from "./network";
import { RaceStore } from "./RaceStore";
import type { CommandRunnerConfig, ServerMessage } from "../src/shared/types";

const port = Number(process.env.PORT ?? 8787);
const root = process.cwd();
const distDir = join(root, "dist");
const store = new RaceStore();
const conductor = new DemoConductor(store);
let commandRunner: CommandRunner | undefined;
let connectionSequence = 1;

const sockets = new Map<string, WebSocket>();

const mimeTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8"
};

function log(message: string): void {
  console.log(`[rube-rally] ${message}`);
}

function send(ws: WebSocket, message: ServerMessage): void {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function broadcast(message: ServerMessage): void {
  sockets.forEach((ws) => send(ws, message));
}

store.subscribe((event, snapshot) => {
  log(`event ${event.id} ${event.type}${event.laneId ? ` ${event.laneId}` : ""}`);
  broadcast({ type: "server.event", event, snapshot });
});

async function readCommandConfig(): Promise<CommandRunnerConfig | undefined> {
  const configPath = join(root, "runner.config.json");
  if (!existsSync(configPath)) return undefined;
  const raw = await readFile(configPath, "utf-8");
  return JSON.parse(raw) as CommandRunnerConfig;
}

async function serveStatic(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const requestUrl = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (requestUrl.pathname === "/api/join-url") {
    const appPort = requestUrl.searchParams.get("appPort") ?? "";
    const appProtocol = requestUrl.searchParams.get("appProtocol") ?? "http:";
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(buildJoinUrlResponse(req, appPort, appProtocol)));
    return;
  }

  if (!existsSync(distDir)) {
    res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    res.end("Agent Rube Rally server is running. Start Vite with pnpm dev or build with pnpm build for static serving.");
    return;
  }

  const requestPath = requestUrl.pathname;
  const normalized = normalize(requestPath).replace(/^(\.\.[/\\])+/, "");
  const candidate = normalized === "/" ? join(distDir, "index.html") : join(distDir, normalized);
  const filePath = existsSync(candidate) && !candidate.endsWith("/") ? candidate : join(distDir, "index.html");
  const ext = extname(filePath);
  res.writeHead(200, { "content-type": mimeTypes[ext] ?? "application/octet-stream" });
  createReadStream(filePath).pipe(res);
}

const httpServer = createServer((req, res) => {
  serveStatic(req, res).catch((error) => {
    res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end(error instanceof Error ? error.message : "Unknown server error");
  });
});

const wsServer = new WebSocketServer({ server: httpServer, path: "/ws" });

wsServer.on("connection", (ws) => {
  const connectionId = `conn-${connectionSequence++}`;
  sockets.set(connectionId, ws);
  log(`client ${connectionId} connected`);

  send(ws, {
    type: "server.snapshot",
    connectionId,
    snapshot: store.getSnapshot()
  });

  ws.on("message", async (data) => {
    try {
      const message = parseClientMessage(data.toString());

      if (message.type === "client.hello") {
        store.connectPhone(connectionId, message.surface, message.userAgent, message.hapticsSupport);
      }

      if (message.type === "client.join_lane") {
        store.assignLane(connectionId, message.laneId);
      }

      if (message.type === "client.haptics_result") {
        store.recordHapticsResult(connectionId, message.result);
      }

      if (message.type === "presenter.start") {
        conductor.stop();
        commandRunner?.stop();
        if (message.mode === "commands") {
          const config = await readCommandConfig();
          if (!config) {
            store.appendEvent({
              type: "error.surfaced",
              label: "runner.config.json not found; deterministic demo remains available",
              severity: "error"
            });
            return;
          }
          commandRunner = new CommandRunner(store, config);
          commandRunner.start();
        } else {
          conductor.start();
        }
      }

      if (message.type === "presenter.reset") {
        conductor.stop();
        commandRunner?.stop();
        store.reset();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown message error";
      send(ws, { type: "server.error", code: "bad_message", message });
      store.appendEvent({ type: "error.surfaced", label: message, severity: "error" });
    }
  });

  ws.on("close", () => {
    sockets.delete(connectionId);
    store.disconnectPhone(connectionId);
    log(`client ${connectionId} disconnected`);
  });
});

httpServer.listen(port, "0.0.0.0", () => {
  log(`server listening on http://0.0.0.0:${port}`);
});
