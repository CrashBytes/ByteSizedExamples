/**
 * A tamper-evident, append-only ledger of attested changesets.
 *
 * Each attestation records the hash of the one before it (`prev`), so the
 * entries form a hash chain. Altering any past changeset changes its
 * attestation hash, which breaks the `prev` link of every entry after it — so a
 * single edit anywhere is detectable by walking the chain, the same property
 * that makes a git history or a blockchain tamper-evident.
 */

import type { KeyObject } from 'node:crypto';
import type { AgentContext, Attestation, Changeset, VerifyResult } from './types.js';
import { signAttestation, type SignOptions } from './attest.js';
import { verifyAttestation } from './verify.js';

export interface LedgerEntry {
  changeset: Changeset;
  attestation: Attestation;
}

export class ProvenanceLedger {
  private readonly entries: LedgerEntry[] = [];

  /** Sign `changeset` (linked to the current head) and append it to the chain. */
  append(
    changeset: Changeset,
    agent: AgentContext,
    privateKey: KeyObject,
    options: Omit<SignOptions, 'prev'> = {},
  ): Attestation {
    const prev = this.head()?.hash ?? null;
    const attestation = signAttestation(changeset, agent, privateKey, { ...options, prev });
    this.entries.push({ changeset, attestation });
    return attestation;
  }

  /** The most recent attestation, or undefined for an empty ledger. */
  head(): Attestation | undefined {
    return this.entries.at(-1)?.attestation;
  }

  /** A read-only view of the entries in append order. */
  list(): readonly LedgerEntry[] {
    return this.entries;
  }

  /**
   * Verify every attestation and the linkage between them. Returns the full set
   * of problems found rather than failing on the first, so callers can see the
   * complete picture of where a chain went wrong.
   */
  verifyChain(publicKey: KeyObject): VerifyResult {
    const reasons: string[] = [];
    let expectedPrev: string | null = null;

    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i];
      if (!entry) continue;

      const result = verifyAttestation(entry.attestation, entry.changeset, publicKey);
      if (!result.valid) {
        reasons.push(`entry ${i} (${entry.changeset.id}): ${result.reasons.join('; ')}`);
      }

      if (entry.attestation.payload.prev !== expectedPrev) {
        reasons.push(
          `entry ${i} (${entry.changeset.id}): broken chain link — expected prev ` +
            `${expectedPrev ?? 'null'}, got ${entry.attestation.payload.prev ?? 'null'}`,
        );
      }

      expectedPrev = entry.attestation.hash;
    }

    return { valid: reasons.length === 0, reasons };
  }
}
