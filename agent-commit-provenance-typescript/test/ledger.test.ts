import { describe, it, expect } from 'vitest';
import { ProvenanceLedger } from '../src/ledger.js';
import { keyPairFromSeed } from '../src/keys.js';
import { sha256 } from '../src/canonical.js';
import type { AgentContext, Changeset } from '../src/types.js';

const keys = keyPairFromSeed(Buffer.alloc(32, 2));

function agent(prompt: string): AgentContext {
  return {
    agentId: 'agent://test/1',
    model: 'claude-opus-4-8',
    promptHash: sha256(prompt),
    toolCalls: [],
    supervisor: 'lead@example.com',
  };
}

function changeset(id: string, value: number): Changeset {
  return { id, files: [{ path: 'src/x.ts', op: 'modify', contents: `export const x = ${value};\n` }] };
}

const t = (n: number) => ({ issuedAt: `2026-06-29T0${n}:00:00.000Z` });

describe('ProvenanceLedger', () => {
  it('links each attestation to the previous one', () => {
    const ledger = new ProvenanceLedger();
    const a = ledger.append(changeset('CS-1', 1), agent('one'), keys.privateKey, t(1));
    const b = ledger.append(changeset('CS-2', 2), agent('two'), keys.privateKey, t(2));

    expect(a.payload.prev).toBeNull();
    expect(b.payload.prev).toBe(a.hash);
    expect(ledger.head()?.hash).toBe(b.hash);
  });

  it('verifies a clean chain', () => {
    const ledger = new ProvenanceLedger();
    ledger.append(changeset('CS-1', 1), agent('one'), keys.privateKey, t(1));
    ledger.append(changeset('CS-2', 2), agent('two'), keys.privateKey, t(2));
    ledger.append(changeset('CS-3', 3), agent('three'), keys.privateKey, t(3));

    const result = ledger.verifyChain(keys.publicKey);
    expect(result.valid).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it('detects tampering with an already-committed changeset', () => {
    const ledger = new ProvenanceLedger();
    ledger.append(changeset('CS-1', 1), agent('one'), keys.privateKey, t(1));
    ledger.append(changeset('CS-2', 2), agent('two'), keys.privateKey, t(2));

    // Mutate the contents of the first entry after the fact.
    const first = ledger.list()[0]!;
    first.changeset.files[0]!.contents = 'export const x = 9999;\n';

    const result = ledger.verifyChain(keys.publicKey);
    expect(result.valid).toBe(false);
    expect(result.reasons.some((r) => r.includes('CS-1'))).toBe(true);
    expect(result.reasons.some((r) => r.includes('changeset hash'))).toBe(true);
  });

  it('reports an empty ledger as trivially valid', () => {
    expect(new ProvenanceLedger().verifyChain(keys.publicKey).valid).toBe(true);
  });
});
