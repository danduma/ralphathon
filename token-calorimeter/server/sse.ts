import type { Response } from "express";
import type { WorkflowEvent } from "./types";

export function setSseHeaders(res: Response): void {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no"
  });
}

export function writeSseEvent(res: Response, event: WorkflowEvent): void {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

export function closeSse(res: Response): void {
  if (!res.writableEnded) res.end();
}
