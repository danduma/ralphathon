import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import type { CommandRunnerConfig } from "../src/shared/types";
import { parseCommandLine } from "./messages";
import type { RaceStore } from "./RaceStore";

export class CommandRunner {
  private children: Array<ReturnType<typeof spawn>> = [];

  constructor(private readonly store: RaceStore, private readonly config: CommandRunnerConfig) {}

  start(): void {
    this.stop();
    this.store.startCountdown();

    for (const commandConfig of this.config.commands) {
      const child = spawn(commandConfig.command, commandConfig.args ?? [], {
        stdio: ["ignore", "pipe", "pipe"],
        shell: false
      });
      this.children.push(child);

      const timeout = setTimeout(() => {
        child.kill("SIGTERM");
        this.store.appendEvent({
          laneId: commandConfig.laneId,
          type: "error.surfaced",
          label: `Command timed out after ${this.config.timeoutMs}ms`,
          severity: "error"
        });
      }, this.config.timeoutMs);

      createInterface({ input: child.stdout }).on("line", (line) => {
        try {
          const parsed = parseCommandLine(line);
          this.store.appendEvent(parsed);
        } catch (error) {
          this.store.appendEvent({
            laneId: commandConfig.laneId,
            type: "error.surfaced",
            label: error instanceof Error ? error.message : "Malformed command output",
            severity: "error"
          });
        }
      });

      createInterface({ input: child.stderr }).on("line", (line) => {
        this.store.appendEvent({
          laneId: commandConfig.laneId,
          type: "error.surfaced",
          label: line,
          severity: "error"
        });
      });

      child.on("close", () => {
        clearTimeout(timeout);
      });
    }
  }

  stop(): void {
    this.children.forEach((child) => {
      if (!child.killed) child.kill("SIGTERM");
    });
    this.children = [];
  }
}
