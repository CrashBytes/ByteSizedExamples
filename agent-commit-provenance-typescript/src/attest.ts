/**
 * Creating attestations.
 *
 * An attestation is the signed claim "agent X, running model Y under supervisor
 * Z, produced exactly this changeset". We build the payload, canonicalize it,
 * sign the canonical bytes with ed25519, and record the payload hash so the
 * attestation can act as a link in a chain (see {@link ProvenanceLedger}).
 */

import { sign } from 'node:crypto';
import type { KeyObject } from 'node:crypto';
import type { AgentContext, Attestation, AttestationPayload, Changeset } from './types.js';
import { canonicalize, hashChangeset, sha256 } from './canonical.js';

export interface SignOptions {
  /** Hash of the previous attestation in a chain. Omit/null for the first. */
  prev?: string | null;
  /** Override the issued-at timestamp. Defaults to now; pass a fixed value for reproducibility. */
  issuedAt?: string;
}

/**
 * Produce a signed attestation binding `changeset` to `agent`. The private key
 * never leaves this call; only the public key is needed to verify the result.
 */
export function signAttestation(
  changeset: Changeset,
  agent: AgentContext,
  privateKey: KeyObject,
  options: SignOptions = {},
): Attestation {
  const payload: AttestationPayload = {
    v: 1,
    changesetId: changeset.id,
    changesetHash: hashChangeset(changeset),
    agent,
    issuedAt: options.issuedAt ?? new Date().toISOString(),
    prev: options.prev ?? null,
  };

  const canonical = canonicalize(payload);
  // ed25519 takes a null algorithm — the curve already fixes the hash.
  const signature = sign(null, Buffer.from(canonical, 'utf8'), privateKey).toString('base64');

  return { payload, signature, hash: sha256(canonical) };
}
