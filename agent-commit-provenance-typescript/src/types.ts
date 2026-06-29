/**
 * Core data shapes for agent-commit provenance.
 *
 * The model is deliberately small: a {@link Changeset} is the *what* (the files
 * an agent changed), an {@link AgentContext} is the *who/how* (which agent,
 * model, prompt and supervisor produced it), and an {@link Attestation} binds
 * the two together with an ed25519 signature so the pair can be verified later
 * by anyone holding the public key — without trusting the host that stored it.
 */

/** A single file touched by a changeset. */
export interface FileChange {
  path: string;
  /** What happened to the file. */
  op: 'add' | 'modify' | 'delete';
  /** The full new contents after the change. Empty string for a delete. */
  contents: string;
}

/** A tool the agent invoked while producing a change. */
export interface ToolCall {
  name: string;
  /** A short, stable digest of the arguments — not the raw args. */
  argsDigest: string;
}

/** The provenance context: who and what produced a changeset. */
export interface AgentContext {
  /** Stable identifier for the agent that authored the change. */
  agentId: string;
  /** The model that produced the change, e.g. "claude-opus-4-8". */
  model: string;
  /** SHA-256 (hex) of the prompt that produced the change. */
  promptHash: string;
  /** The tools the agent invoked while producing the change. */
  toolCalls: ToolCall[];
  /** Identifier of the human who supervised or approved the run. */
  supervisor: string;
}

/** A set of file changes the agent proposes as one unit. */
export interface Changeset {
  /** A meaningful id for the change, e.g. a ticket or run id. */
  id: string;
  /** The files this changeset touches. Order does not matter. */
  files: FileChange[];
}

/** The signed body of an attestation. Everything here is covered by the signature. */
export interface AttestationPayload {
  /** Attestation format version. */
  v: 1;
  changesetId: string;
  /** Order-independent content hash of the changeset. */
  changesetHash: string;
  agent: AgentContext;
  /** ISO-8601 timestamp the attestation was created. */
  issuedAt: string;
  /** Hash of the previous attestation in the chain, or null for the first. */
  prev: string | null;
}

/** A verifiable record binding a changeset to its provenance. */
export interface Attestation {
  payload: AttestationPayload;
  /** base64 ed25519 signature over the canonical payload. */
  signature: string;
  /** Canonical hash of the payload — the link the next attestation points to. */
  hash: string;
}

/** The result of a verification check. */
export interface VerifyResult {
  valid: boolean;
  /** Empty when valid; one human-readable reason per failed check otherwise. */
  reasons: string[];
}
