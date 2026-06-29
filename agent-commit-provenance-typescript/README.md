# Verifiable Agent-Commit Provenance (TypeScript)

Companion code for the CrashBytes tutorial. When an AI agent writes code, can you
prove _which_ agent, running _which_ model under _whose_ supervision, produced
_exactly_ the diff in front of you — and detect if anyone changed it afterward?
This is a small, dependency-light library that does that: it hashes a changeset,
signs an **attestation** binding the diff to its provenance with **ed25519**, and
chains attestations into an append-only, tamper-evident **ledger** anyone can
verify offline with the public key.

The whole thing is deterministic and runs with **zero API keys and zero runtime
dependencies** — it is built entirely on Node's `crypto`.

> **Tutorial:** [Build a Verifiable Agent-Commit Provenance Trail in TypeScript](https://crashbytes.com/articles/verifiable-agent-commit-provenance-typescript-2026)

```ts
import {
  ProvenanceLedger,
  verifyAttestation,
  keyPairFromSeed,
  sha256,
} from 'agent-commit-provenance-typescript';

const { privateKey, publicKey } = keyPairFromSeed(Buffer.alloc(32, 7)); // demo seed

const ledger = new ProvenanceLedger();
ledger.append(
  { id: 'CS-1001', files: [{ path: 'src/retention.ts', op: 'modify', contents: '...' }] },
  { agentId: 'agent://refactor-bot/1', model: 'claude-opus-4-8', promptHash: sha256('fix the off-by-one'), toolCalls: [], supervisor: 'lead@example.com' },
  privateKey,
);

console.log(ledger.verifyChain(publicKey).valid); // -> true, until someone tampers
```

## What You'll Learn

- Why **canonical serialization** is the foundation of any signing scheme — and
  how a few lines of recursive key-sorting make JSON reproducible enough to sign.
- How to build an **order-independent content hash** of a multi-file changeset,
  so the same set of edits hashes identically no matter what order files arrive.
- How to sign and verify an **ed25519 attestation** that binds a changeset to its
  agent, model, prompt hash, tool calls, and human supervisor.
- How to chain attestations into a **tamper-evident ledger** where editing any
  past changeset breaks every link after it — and how to detect exactly that.
- How to make the whole thing **deterministic and offline** so it is trivial to
  test and reason about, with a `keyPairFromSeed` helper for reproducible keys.

## Run It

```bash
npm install
npm run demo        # build a ledger, verify it, then tamper and watch it fail
npm test            # vitest: canonical hashing, attestation, and ledger checks
npm run type-check  # tsc --noEmit, strict
```

`npm run demo` prints two linked attestations, confirms the chain is valid, then
edits an already-attested file and shows verification reject it with a specific
reason.

## How It Works

| File                | Responsibility                                                                 |
| ------------------- | ------------------------------------------------------------------------------ |
| `src/types.ts`      | The data shapes: `Changeset`, `AgentContext`, `Attestation`, `VerifyResult`.   |
| `src/canonical.ts`  | Deterministic JSON canonicalization, `sha256`, and `hashChangeset`.            |
| `src/keys.ts`       | ed25519 key generation, deterministic `keyPairFromSeed`, public-key export.    |
| `src/attest.ts`     | `signAttestation` — build the payload and sign the canonical bytes.            |
| `src/verify.ts`     | `verifyAttestation` — three independent checks, each reported separately.      |
| `src/ledger.ts`     | `ProvenanceLedger` — append-only hash chain with `verifyChain`.                |
| `examples/demo.ts`  | A runnable end-to-end scenario including a tamper case.                         |

### The three things verification proves

1. **The attestation was not edited** — its recorded hash still matches its payload.
2. **The signature is authentic** — it verifies against the claimed public key.
3. **The code was not changed** — the changeset still hashes to the attested value.

Only when all three hold is the pairing of code and provenance trustworthy. Each
check reports independently, so a failure tells you _what_ broke.

## Scope and Caveats

This is a teaching implementation meant to be read in an afternoon, not a key-
management product. In a real deployment you would source the signing key from an
HSM or KMS rather than a seed, anchor the ledger head somewhere external (a git
tag, a transparency log, a notary) so the chain itself cannot be silently
rewritten, and bind attestations to real VCS object ids. The cryptographic
core here — canonical hashing, ed25519 attestations, and a hash chain — is the
same shape those production systems use.

## License

MIT — see [LICENSE](./LICENSE).
