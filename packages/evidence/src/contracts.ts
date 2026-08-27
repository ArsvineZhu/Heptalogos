import type {
  ActivityId,
  EvidenceId,
  Instant,
  RetentionClass,
  Sensitivity,
} from "@heptalogos/foundation-contracts";
import type { PersistenceMutationTransactionContext } from "@heptalogos/persistence";

export interface EvidenceDraft {
  readonly evidenceKind: string;
  readonly evidenceContractVersion: string;
  readonly subjectRef?: string;
  readonly objectRef?: string;
  readonly factRef?: string;
  readonly retentionClass: RetentionClass;
  readonly sensitivity: Sensitivity;
}

export interface EvidenceRecord extends EvidenceDraft {
  readonly evidenceId: EvidenceId;
  readonly activityId: ActivityId;
  readonly recordedAt: Instant;
}

export interface EvidenceService {
  recordRequired(
    transaction: PersistenceMutationTransactionContext,
    draft: EvidenceDraft,
  ): Promise<EvidenceRecord>;
}
