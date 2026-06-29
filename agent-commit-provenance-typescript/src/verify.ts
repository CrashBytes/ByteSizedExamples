/**
 * Verifying attestations.
 *
 * Verification answers three independent questions, and reports each failure
 * separately so you can tell *what* went wrong:
 *   1. Has the attestation payload itself been altered since it was hashed?
 *   2. Does the signature actually come from the claimed key?
 *   3. Does the changeset in front of you hash to what the attestation swore to?
 * Only if all three pass is the pairing of code and provenance trustworthy.
 */

import { verify } from 'node:crypto';
import type { KeyObject } from 'node:crypto';
import type { Attestation, Changeset, VerifyResult } from './types.js';
import { canonicalize, hashChangeset, sha256 } from './canonical.js';

/**
 * Verify that `attestation` is an authentic, untampered claim about `changeset`,
 * signed by the holder of the private key matching `publicKey`.
 */
export function verifyAttestation(
  attestation: Attestation,
  changeset: Changeset,
  publicKey: KeyObject,
): VerifyResult {
  const reasons: string[] = [];
  const canonical = canonicalize(attestation.payload);

  // 1. The recorded hash must match the payload (detects edits to the attestation).
  if (sha256(canonical) !== attestation.hash) {
    reasons.push('attestation hash does not match its payload');
  }

  // 2. The signature must verify against the canonical payload bytes.
  let signatureOk = false;
  try {
    signatureOk = verify(
      null,
      Buffer.from(canonical, 'utf8'),
      publicKey,
      Buffer.from(attestation.signature, 'base64'),
    );
  } catch {
    signatureOk = false;
  }
  if (!signatureOk) {
    reasons.push('signature does not verify against the payload');
  }

  // 3. The changeset must hash to what the payload attested (detects edits to the code).
  if (hashChangeset(changeset) !== attestation.payload.changesetHash) {
    reasons.push('changeset hash does not match the attested hash');
  }

  return { valid: reasons.length === 0, reasons };
}
