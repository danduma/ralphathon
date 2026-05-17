import { useSyncExternalStore } from "react";
import { calorimeterManager } from "../managers/CalorimeterManager";

export function useCalorimeterSnapshot() {
  return useSyncExternalStore(
    (listener) => calorimeterManager.subscribe(listener),
    () => calorimeterManager.getSnapshot(),
    () => calorimeterManager.getSnapshot()
  );
}
