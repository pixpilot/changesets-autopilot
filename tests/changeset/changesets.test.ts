import { describe, test, expect } from 'vitest';

import {
  checkForChangesetFiles,
  getChangesetFiles,
  isChangesetFile,
} from '../../src/changeset/changesets';

describe('changesets', () => {
  test('isChangesetFile should detect .md files except README.md', () => {
    expect(isChangesetFile('foo.md')).toBe(true);
    expect(isChangesetFile('README.md')).toBe(false);
    expect(isChangesetFile('bar.txt')).toBe(false);
  });

  test('getChangesetFiles should return an array', () => {
    const files = getChangesetFiles();
    expect(Array.isArray(files)).toBe(true);
  });

  test('checkForChangesetFiles should return a boolean', () => {
    const result = checkForChangesetFiles();
    expect(typeof result).toBe('boolean');
  });
});

// Placeholder for changesets tests
// Move or create tests for src/changeset/changesets.ts here.
