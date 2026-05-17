import type { WorkflowEvent } from "./types";

export async function readSseStream(response: Response, onEvent: (event: WorkflowEvent) => void): Promise<void> {
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(body || `Request failed with ${response.status}`);
  }

  if (!response.body) {
    throw new Error("The server did not return a readable stream.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";

    for (const frame of frames) {
      const event = parseSseFrame(frame);
      if (event) onEvent(event);
    }
  }

  if (buffer.trim()) {
    const event = parseSseFrame(buffer);
    if (event) onEvent(event);
  }
}

function parseSseFrame(frame: string): WorkflowEvent | undefined {
  const data = frame
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
    .join("\n");
  if (!data) return undefined;
  return JSON.parse(data) as WorkflowEvent;
}
