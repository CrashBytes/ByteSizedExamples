import { describe, it, expect } from 'vitest';
import { canonicalize, sha256, hashChangeset } from '../src/canonical.js';
import type { Changeset } from '../src/types.js';

describe('canonicalize', () => {
  it('sorts object keys recursively so order does not matter', () => {
    const a = canonicalize({ b: 1, a: { d: 4, c: 3 } });
    const b = canonicalize({ a: { c: 3, d: 4 }, b: 1 });
    expect(a).toBe(b);
    expect(a).toBe('{"a":{"c":3,"d":4},"b":1}');
  });

  it('preserves array order (arrays are ordered)', () => {
    expect(canonicalize([3, 1, 2])).toBe('[3,1,2]');
  });
});

describe('sha256', () => {
  it('matches the known empty-string digest', () => {
    expect(sha256('')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });
});

describe('hashChangeset', () => {
  const base: Changeset = {
    id: 'CS-1',
    files: [
      { path: 'a.ts', op: 'add', contents: 'export const a = 1;\n' },
      { path: 'b.ts', op: 'modify', contents: 'export const b = 2;\n' },
    ],
  };

  it('is stable for identical input', () => {
    expect(hashChangeset(base)).toBe(hashChangeset(structuredClone(base)));
  });

  it('is independent of file order', () => {
    const reordered: Changeset = { id: base.id, files: [...base.files].reverse() };
    expect(hashChangeset(reordered)).toBe(hashChangeset(base));
  });

  it('changes when any file content changes', () => {
    const edited = structuredClone(base);
    edited.files[0]!.contents = 'export const a = 999;\n';
    expect(hashChangeset(edited)).not.toBe(hashChangeset(base));
  });

  it('changes when a path changes', () => {
    const renamed = structuredClone(base);
    renamed.files[0]!.path = 'renamed.ts';
    expect(hashChangeset(renamed)).not.toBe(hashChangeset(base));
  });
});
