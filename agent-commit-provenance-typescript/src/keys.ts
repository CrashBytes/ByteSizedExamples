/**
 * ed25519 key management.
 *
 * ed25519 is a good fit for provenance: small keys, small signatures,
 * deterministic signing, and it is built into Node's `crypto` module, so the
 * whole library needs zero external dependencies. {@link generateKeyPair} is
 * what you would use in production; {@link keyPairFromSeed} builds a key pair
 * from a fixed 32-byte seed so demos and tests are perfectly reproducible.
 */

import {
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  type KeyObject,
} from 'node:crypto';

export interface KeyPair {
  privateKey: KeyObject;
  publicKey: KeyObject;
}

/** Generate a fresh, random ed25519 key pair. */
export function generateKeyPair(): KeyPair {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  return { privateKey, publicKey };
}

// A PKCS#8 ed25519 private key is a fixed 16-byte ASN.1 header followed by the
// raw 32-byte seed. Prepending the header lets us turn any 32-byte seed into a
// key object Node will accept — the standard trick for deterministic ed25519.
const PKCS8_ED25519_PREFIX = Buffer.from('302e020100300506032b657004220420', 'hex');

/**
 * Build a deterministic ed25519 key pair from a 32-byte seed. The same seed
 * always yields the same keys — never use a guessable seed for anything real.
 */
export function keyPairFromSeed(seed: Buffer): KeyPair {
  if (seed.length !== 32) {
    throw new Error(`seed must be exactly 32 bytes, got ${seed.length}`);
  }
  const der = Buffer.concat([PKCS8_ED25519_PREFIX, seed]);
  const privateKey = createPrivateKey({ key: der, format: 'der', type: 'pkcs8' });
  const publicKey = createPublicKey(privateKey);
  return { privateKey, publicKey };
}

/** Export a public key to base64 SPKI DER, suitable for storage or transport. */
export function exportPublicKey(publicKey: KeyObject): string {
  return publicKey.export({ format: 'der', type: 'spki' }).toString('base64');
}

/** Re-import a public key previously produced by {@link exportPublicKey}. */
export function importPublicKey(base64Spki: string): KeyObject {
  return createPublicKey({
    key: Buffer.from(base64Spki, 'base64'),
    format: 'der',
    type: 'spki',
  });
}
