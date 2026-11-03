/**
 * Types for Yomirra Durable Offline-First Outbox Journal & Hybrid Preferences
 * Conforming to Q138 & Q97 Architecture Specifications
 */

export type SyncEntityType = "library" | "history" | "collection" | "settings";

export type OutboxOperationType = "upsert" | "delete";

export type OutboxStatus = "pending" | "processing" | "synced" | "failed";

/**
 * Entry in the IndexedDB `sync_journal` object store.
 * Represents a durable offline mutation waiting to be synced to cloud.
 */
export interface SyncJournalEntry<T = unknown> {
  id: string; // UUID
  userId: string;
  entityType: SyncEntityType;
  entityId: string;
  operation: OutboxOperationType;
  payload: Partial<T>;
  baseServerRevision: number;
  status: OutboxStatus;
  leaseExpiresAt?: number;
  createdAt: number;
  retryCount: number;
  lastError?: string;
  isExplicitRestore?: boolean;
}

/**
 * Entry in the IndexedDB `tombstones` object store.
 * Tracks deleted items for anti-resurrection synchronization.
 */
export interface TombstoneRecord {
  userId: string;
  entityType: SyncEntityType;
  entityId: string;
  deletedAt: number;
  tombstoneExpiresAt: number; // Expiration timestamp for compaction (30 or 180 days)
}

/**
 * Entry in the IndexedDB `sync_metadata` object store.
 * Used for sync coordination, watermarks, and lease fallback.
 */
export interface SyncMetadataRecord<T = unknown> {
  key: string;
  value: T;
  updatedAt: number;
}

export type ReconciliationMode = "mode1_incremental" | "mode2_full_resync";

/**
 * Entry in the IndexedDB `reconciliation_audit_log` object store.
 * Auditable record of sync reconciliation and quarantined items.
 */
export interface ReconciliationAuditEntry {
  id: string; // UUID
  timestamp: number;
  mode: ReconciliationMode;
  action: string;
  quarantinedEntities: Array<{
    entityType: SyncEntityType;
    entityId: string;
    details?: string;
  }>;
  details?: string;
}

/**
 * Storage quota status information.
 */
export interface StorageQuotaInfo {
  quota: number;
  usage: number;
  percentage: number;
  isPressure: boolean; // true if usage / quota >= 0.9 (90% capacity)
}

/**
 * Snapshot for emergency local backup export.
 */
export interface EmergencyBackupSnapshot {
  exportedAt: number;
  dbVersion: number;
  keyval: Record<string, unknown>;
  syncJournal: SyncJournalEntry[];
  tombstones: TombstoneRecord[];
  syncMetadata: SyncMetadataRecord[];
  reconciliationAuditLog: ReconciliationAuditEntry[];
}
