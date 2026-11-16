import type { MemoryStore } from "../store/memory-store.js";
import { newId } from "../utils/ids.js";

export function recordCreation(
  store: MemoryStore,
  entityType: string,
  entityId: string,
  creatorAccountId: string,
): void {
  store.creationAuditEvents.push({
    id: newId(),
    entityType,
    entityId,
    createdAt: new Date().toISOString(),
    creatorAccountId,
  });
}