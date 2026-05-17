import { eventTypes, hapticPatternIds, type ClientMessage, type HapticsSupportState, type LaneId, type RaceEventType } from "../src/shared/types";
import { lanes } from "../src/shared/raceConfig";

const laneIds = new Set(lanes.map((lane) => lane.id));
const eventTypeSet = new Set<string>(eventTypes);
const hapticResultSet = new Set<HapticsSupportState>(["unknown", "supported", "unsupported", "failed"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isLaneId(value: unknown): value is LaneId {
  return typeof value === "string" && laneIds.has(value as LaneId);
}

export function isRaceEventType(value: unknown): value is RaceEventType {
  return typeof value === "string" && eventTypeSet.has(value);
}

export function parseClientMessage(raw: string): ClientMessage {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Message was not valid JSON");
  }

  if (!isRecord(parsed) || typeof parsed.type !== "string") {
    throw new Error("Message must contain a type");
  }

  switch (parsed.type) {
    case "client.hello": {
      if (parsed.surface !== "screen" && parsed.surface !== "phone") {
        throw new Error("client.hello requires surface screen or phone");
      }

      return {
        type: "client.hello",
        surface: parsed.surface,
        userAgent: typeof parsed.userAgent === "string" ? parsed.userAgent : undefined,
        hapticsSupport: hapticResultSet.has(parsed.hapticsSupport as HapticsSupportState)
          ? (parsed.hapticsSupport as HapticsSupportState)
          : undefined
      };
    }
    case "client.join_lane": {
      if (parsed.laneId !== undefined && !isLaneId(parsed.laneId)) {
        throw new Error("client.join_lane laneId is invalid");
      }

      return {
        type: "client.join_lane",
        laneId: parsed.laneId
      };
    }
    case "client.haptics_result": {
      if (typeof parsed.supported !== "boolean" || !hapticResultSet.has(parsed.result as HapticsSupportState)) {
        throw new Error("client.haptics_result requires supported and result");
      }

      return {
        type: "client.haptics_result",
        supported: parsed.supported,
        result: parsed.result as HapticsSupportState
      };
    }
    case "presenter.start": {
      if (parsed.mode !== undefined && parsed.mode !== "demo" && parsed.mode !== "commands") {
        throw new Error("presenter.start mode is invalid");
      }

      return {
        type: "presenter.start",
        mode: parsed.mode === "commands" ? "commands" : "demo"
      };
    }
    case "presenter.reset":
      return { type: "presenter.reset" };
    case "presenter.stop_haptics":
      return { type: "presenter.stop_haptics" };
    default:
      throw new Error(`Unknown message type: ${parsed.type}`);
  }
}

export function parseCommandLine(line: string): {
  laneId: LaneId;
  type: RaceEventType;
  label: string;
  progressDelta?: number;
} {
  let parsed: unknown;
  try {
    parsed = JSON.parse(line);
  } catch {
    throw new Error("Command output line was not JSON");
  }

  if (!isRecord(parsed) || !isLaneId(parsed.laneId) || !isRaceEventType(parsed.type) || typeof parsed.label !== "string") {
    throw new Error("Command output requires laneId, type, and label");
  }

  if (parsed.hapticPatternId !== undefined && !hapticPatternIds.includes(parsed.hapticPatternId as never)) {
    throw new Error("Command output hapticPatternId is invalid");
  }

  return {
    laneId: parsed.laneId,
    type: parsed.type,
    label: parsed.label,
    progressDelta: typeof parsed.progressDelta === "number" ? parsed.progressDelta : undefined
  };
}
