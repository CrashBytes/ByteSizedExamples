/**
 * Runnable end-to-end demo. No API keys, fully deterministic.
 *
 *   npm run demo
 *
 * It builds a two-entry provenance ledger of agent changesets, verifies the
 * chain, then tampers with already-committed code and shows verification catch
 * it — both the single-attestation check and the whole-chain check.
 */

import {
  ProvenanceLedger,
  verifyAttestation,
  keyPairFromSeed,
  exportPublicKey,
  sha256,
  type AgentContext,
  type Changeset,
} from '../src/index.js';

// A fixed seed makes the whole run reproducible. NEVER do this for real keys.
const { privateKey, publicKey } = keyPairFromSeed(Buffer.alloc(32, 7));

function agent(promptText: string): AgentContext {
  return {
    agentId: 'agent://refactor-bot/1',
    model: 'claude-opus-4-8',
    promptHash: sha256(promptText),
    toolCalls: [{ name: 'read_file', argsDigest: sha256('src/retention.ts') }],
    supervisor: 'renata.okafor@example.com',
  };
}

const first: Changeset = {
  id: 'CS-1001',
  files: [
    { path: 'src/retention.ts', op: 'modify', contents: 'export const WINDOW_DAYS = 30;\n' },
    { path: 'test/retention.test.ts', op: 'add', contents: "import './fixtures';\n" },
  ],
};

const second: Changeset = {
  id: 'CS-1002',
  files: [{ path: 'src/retention.ts', op: 'modify', contents: 'export const WINDOW_DAYS = 31;\n' }],
};

const ledger = new ProvenanceLedger();
ledger.append(first, agent('fix the off-by-one in the retention window'), privateKey, {
  issuedAt: '2026-06-29T08:00:00.000Z',
});
ledger.append(second, agent('extend the retention window by one day'), privateKey, {
  issuedAt: '2026-06-29T08:05:00.000Z',
});

console.log('Public key (share this to let anyone verify):');
console.log('  ' + exportPublicKey(publicKey));
console.log();

for (const { changeset, attestation } of ledger.list()) {
  console.log(`Attestation for ${changeset.id}`);
  console.log(`  agent      ${attestation.payload.agent.agentId} (${attestation.payload.agent.model})`);
  console.log(`  prev       ${attestation.payload.prev ?? '(genesis)'}`);
  console.log(`  hash       ${attestation.hash}`);
  console.log();
}

const chain = ledger.verifyChain(publicKey);
console.log(`Chain verification: ${chain.valid ? 'VALID ✓' : 'INVALID ✗'}`);
console.log();

// Now tamper: someone edits a file after it was attested, leaving the
// attestation in place and hoping nobody re-checks.
const firstEntry = ledger.list()[0];
if (!firstEntry) throw new Error('expected a first entry');

const tampered: Changeset = {
  id: firstEntry.changeset.id,
  files: [
    { path: 'src/retention.ts', op: 'modify', contents: 'export const WINDOW_DAYS = 9999;\n' },
    { path: 'test/retention.test.ts', op: 'add', contents: "import './fixtures';\n" },
  ],
};

const tamperCheck = verifyAttestation(firstEntry.attestation, tampered, publicKey);
console.log('Re-verifying CS-1001 against tampered code:');
console.log(`  ${tamperCheck.valid ? 'VALID ✓' : 'INVALID ✗'}`);
for (const reason of tamperCheck.reasons) console.log(`  - ${reason}`);
