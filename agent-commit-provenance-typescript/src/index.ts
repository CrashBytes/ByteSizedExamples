/**
 * agent-commit-provenance-typescript
 *
 * A verifiable, tamper-evident provenance trail for AI-agent-authored code
 * changesets. Hash the changeset, sign an attestation binding it to the agent /
 * model / prompt / supervisor, and chain attestations into an append-only
 * ledger anyone can verify offline with the public key. Zero runtime
 * dependencies — everything is built on Node's `crypto`.
 */

export type {
  FileChange,
  ToolCall,
  AgentContext,
  Changeset,
  AttestationPayload,
  Attestation,
  VerifyResult,
} from './types.js';

export { canonicalize, sha256, hashChangeset } from './canonical.js';
export {
  generateKeyPair,
  keyPairFromSeed,
  exportPublicKey,
  importPublicKey,
  type KeyPair,
} from './keys.js';
export { signAttestation, type SignOptions } from './attest.js';
export { verifyAttestation } from './verify.js';
export { ProvenanceLedger, type LedgerEntry } from './ledger.js';
