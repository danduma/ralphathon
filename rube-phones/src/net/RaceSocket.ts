import type { ClientMessage, ServerMessage } from "../shared/types";

type MessageHandler = (message: ServerMessage) => void;
type ConnectionHandler = (connected: boolean) => void;

export class RaceSocket {
  private ws?: WebSocket;
  private reconnectTimer?: number;
  private connectedHandler?: ConnectionHandler;
  private messageHandler?: MessageHandler;
  private queue: ClientMessage[] = [];

  constructor(private readonly url = RaceSocket.defaultUrl()) {}

  static defaultUrl(): string {
    const { protocol, hostname, port } = window.location;
    const wsProtocol = protocol === "https:" ? "wss:" : "ws:";
    const targetPort = import.meta.env.DEV ? "8787" : port || "8787";
    return `${wsProtocol}//${hostname}:${targetPort}/ws`;
  }

  connect(onMessage: MessageHandler, onConnection: ConnectionHandler): void {
    this.messageHandler = onMessage;
    this.connectedHandler = onConnection;
    this.open();
  }

  send(message: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      return;
    }
    this.queue.push(message);
  }

  close(): void {
    if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer);
    this.ws?.close();
  }

  private open(): void {
    this.ws = new WebSocket(this.url);
    this.ws.addEventListener("open", () => {
      this.connectedHandler?.(true);
      const queued = [...this.queue];
      this.queue = [];
      queued.forEach((message) => this.send(message));
    });
    this.ws.addEventListener("message", (event) => {
      this.messageHandler?.(JSON.parse(event.data as string) as ServerMessage);
    });
    this.ws.addEventListener("close", () => {
      this.connectedHandler?.(false);
      this.reconnectTimer = window.setTimeout(() => this.open(), 750);
    });
    this.ws.addEventListener("error", () => {
      this.connectedHandler?.(false);
    });
  }
}
