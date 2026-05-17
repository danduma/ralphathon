import { useEffect, useMemo, useState } from "react";
import { RaceSocket } from "../net/RaceSocket";
import type { ClientMessage, HapticsSupportState, LaneId, RaceEvent, RaceSnapshot, ServerMessage, SurfaceKind } from "../shared/types";

interface RaceManagerState {
  connected: boolean;
  connectionId?: string;
  snapshot?: RaceSnapshot;
  lastEvent?: RaceEvent;
  errors: string[];
}

type Selector<T> = (state: RaceManagerState) => T;
type Listener<T> = (value: T) => void;

export class RaceManager {
  private state: RaceManagerState = {
    connected: false,
    errors: []
  };
  private subscribers = new Set<{
    selector: Selector<unknown>;
    listener: Listener<unknown>;
    value: unknown;
    isEqual: (a: unknown, b: unknown) => boolean;
  }>();
  private socket?: RaceSocket;
  private hello?: ClientMessage;

  connect(surface: SurfaceKind, hapticsSupport: HapticsSupportState = "unknown"): void {
    this.hello = {
      type: "client.hello",
      surface,
      hapticsSupport,
      userAgent: navigator.userAgent
    };
    if (this.socket) {
      this.send(this.hello);
      return;
    }

    this.socket = new RaceSocket();
    this.socket.connect(
      (message) => this.handleMessage(message),
      (connected) => {
        this.setState({ connected });
        if (connected && this.hello) this.send(this.hello);
      }
    );
  }

  subscribe<T>(selector: Selector<T>, listener: Listener<T>, isEqual: (a: T, b: T) => boolean = Object.is): () => void {
    const subscriber = {
      selector: selector as Selector<unknown>,
      listener: listener as Listener<unknown>,
      value: selector(this.state),
      isEqual: isEqual as (a: unknown, b: unknown) => boolean
    };
    this.subscribers.add(subscriber);
    return () => this.subscribers.delete(subscriber);
  }

  getSnapshot<T>(selector: Selector<T>): T {
    return selector(this.state);
  }

  joinLane(laneId?: LaneId): void {
    this.send({ type: "client.join_lane", laneId });
  }

  reportHapticsResult(supported: boolean, result: HapticsSupportState): void {
    this.send({ type: "client.haptics_result", supported, result });
  }

  startDemo(): void {
    this.send({ type: "presenter.start", mode: "demo" });
  }

  startCommands(): void {
    this.send({ type: "presenter.start", mode: "commands" });
  }

  reset(): void {
    this.send({ type: "presenter.reset" });
  }

  stopHaptics(): void {
    this.send({ type: "presenter.stop_haptics" });
  }

  private send(message: ClientMessage): void {
    this.socket?.send(message);
  }

  private handleMessage(message: ServerMessage): void {
    if (message.type === "server.snapshot") {
      this.setState({
        connectionId: message.connectionId,
        snapshot: message.snapshot
      });
    }
    if (message.type === "server.event") {
      this.setState({
        lastEvent: message.event,
        snapshot: message.snapshot
      });
    }
    if (message.type === "server.error") {
      this.setState({
        errors: [...this.state.errors.slice(-4), message.message]
      });
    }
  }

  private setState(partial: Partial<RaceManagerState>): void {
    this.state = { ...this.state, ...partial };
    this.subscribers.forEach((subscriber) => {
      const next = subscriber.selector(this.state);
      if (!subscriber.isEqual(subscriber.value, next)) {
        subscriber.value = next;
        subscriber.listener(next);
      }
    });
  }
}

export const raceManager = new RaceManager();

export function useRaceSelector<T>(selector: Selector<T>, isEqual?: (a: T, b: T) => boolean): T {
  const stableSelector = useMemo(() => selector, [selector]);
  const [value, setValue] = useState(() => raceManager.getSnapshot(stableSelector));

  useEffect(() => raceManager.subscribe(stableSelector, setValue, isEqual), [stableSelector, isEqual]);

  return value;
}
