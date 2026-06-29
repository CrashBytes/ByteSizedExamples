/**
 * Deterministic serialization and hashing.
 *
 * Signatures are only meaningful if the bytes being signed are reproducible.
 * Two processes that serialize the same logical object must produce the exact
 * same string, or a signature made by one will not verify for the other. JSON
 * does not guarantee key order, so we canonicalize: sort every object's keys
 * recursively before stringifying. Hashing then runs over that canonical form.
 */

import { createHash } from 'node:crypto';
import type { Changeset, FileChange } from './types.js';

/** Serialize a JSON value with object keys sorted recursively, deterministically. */
export function canonicalize(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value !== null && typeof value === 'object') {
    const source = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort()) {
      out[key] = sortValue(source[key]);
    }
    return out;
  }
  return value;
}

/** SHA-256 of a UTF-8 string, hex-encoded. */
export function sha256(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

/**
 * A per-file digest. We hash the contents separately so the outer digest is
 * compact and the same regardless of file size, then bind it to the path and op.
 */
function fileDigest(file: FileChange): string {
  return sha256(
    canonicalize({ op: file.op, path: file.path, contents: sha256(file.contents) }),
  );
}

/**
 * Order-independent content hash of a changeset. Sorting the per-file digests
 * means the same set of changes hashes identically no matter what order the
 * files arrive in — a property you want when agents emit files concurrently.
 */
export function hashChangeset(changeset: Changeset): string {
  const fileDigests = changeset.files.map(fileDigest).sort();
  return sha256(canonicalize({ id: changeset.id, files: fileDigests }));
}
