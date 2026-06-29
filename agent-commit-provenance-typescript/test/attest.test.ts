import { describe, it, expect } from 'vitest';
import { signAttestation } from '../src/attest.js';
import { verifyAttestation } from '../src/verify.js';
import { keyPairFromSeed, generateKeyPair } from '../src/keys.js';
import { sha256 } from '../src/canonical.js';
import type { AgentContext, Changeset } from '../src/types.js';

const keys = keyPairFromSeed(Buffer.alloc(32, 1));

const agent: AgentContext = {
  agentId: 'agent://test/1',
  model: 'claude-opus-4-8',
  promptHash: sha256('do the thing'),
  toolCalls: [{ name: 'read_file', argsDigest: sha256('src/x.ts') }],
  supervisor: 'lead@example.com',
};

const changeset: Changeset = {
  id: 'CS-1',
  files: [{ path: 'src/x.ts', op: 'modify', contents: 'export const x = 1;\n' }],
};

const fixedTime = { issuedAt: '2026-06-29T00:00:00.000Z' };

describe('signAttestation / verifyAttestation', () => {
  it('verifies a freshly signed attestation', () => {
    const att = signAttestation(changeset, agent, keys.privateKey, fixedTime);
    const result = verifyAttestation(att, changeset, keys.publicKey);
    expect(result.valid).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it('is deterministic for a fixed seed, timestamp, and input', () => {
    const a = signAttestation(changeset, agent, keys.privateKey, fixedTime);
    const b = signAttestation(changeset, agent, keys.privateKey, fixedTime);
    expect(b.signature).toBe(a.signature);
    expect(b.hash).toBe(a.hash);
  });

  it('rejects a changeset whose code was tampered with', () => {
    const att = signAttestation(changeset, agent, keys.privateKey, fixedTime);
    const tampered: Changeset = {
      id: 'CS-1',
      files: [{ path: 'src/x.ts', op: 'modify', contents: 'export const x = 666;\n' }],
    };
    const result = verifyAttestation(att, tampered, keys.publicKey);
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain('changeset hash does not match the attested hash');
  });

  it('rejects a signature from the wrong key', () => {
    const att = signAttestation(changeset, agent, keys.privateKey, fixedTime);
    const other = generateKeyPair();
    const result = verifyAttestation(att, changeset, other.publicKey);
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain('signature does not verify against the payload');
  });

  it('rejects an attestation whose payload was edited after signing', () => {
    const att = signAttestation(changeset, agent, keys.privateKey, fixedTime);
    const forged = {
      ...att,
      payload: { ...att.payload, agent: { ...att.payload.agent, supervisor: 'attacker@evil.test' } },
    };
    const result = verifyAttestation(forged, changeset, keys.publicKey);
    expect(result.valid).toBe(false);
    // The hash no longer matches the edited payload, and the signature no longer fits.
    expect(result.reasons).toContain('attestation hash does not match its payload');
    expect(result.reasons).toContain('signature does not verify against the payload');
  });
});
