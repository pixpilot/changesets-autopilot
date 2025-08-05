import fs from 'fs';

import { describe, test, expect } from 'vitest';

import {
  checkForChangesetFiles,
  getChangesetFiles,
  getAllChangesetFiles,
  isChangesetFile,
  isAnyChangesetFile,
  changesetDir,
} from '../../src/changeset/changesets';

describe('changesets', () => {
  test('isChangesetFile should detect .md files except README.md and auto-generated files', () => {
    expect(isChangesetFile('foo.md')).toBe(true);
    expect(isChangesetFile('README.md')).toBe(false);
    expect(isChangesetFile('bar.txt')).toBe(false);
    expect(isChangesetFile('auto-generated-at-12345.md')).toBe(false);
  });

  test('isAnyChangesetFile should detect all .md files except README.md', () => {
    expect(isAnyChangesetFile('foo.md')).toBe(true);
    expect(isAnyChangesetFile('README.md')).toBe(false);
    expect(isAnyChangesetFile('bar.txt')).toBe(false);
    expect(isAnyChangesetFile('auto-generated-at-12345.md')).toBe(true);
  });

  test('getChangesetFiles should return an array', () => {
    const files = getChangesetFiles();
    expect(Array.isArray(files)).toBe(true);
  });

  test('getAllChangesetFiles should return an array', () => {
    const files = getAllChangesetFiles();
    expect(Array.isArray(files)).toBe(true);
  });

  test('checkForChangesetFiles should return a boolean', () => {
    const result = checkForChangesetFiles();
    expect(typeof result).toBe('boolean');
  });

  test('getChangesetFiles returns empty array if .changeset directory does not exist', () => {
    // Temporarily rename .changeset if it exists
    const tempDir = changesetDir + '_bak';
    if (fs.existsSync(changesetDir)) {
      fs.renameSync(changesetDir, tempDir);
    }
    try {
      expect(getChangesetFiles()).toEqual([]);
    } finally {
      // Restore .changeset directory
      if (fs.existsSync(tempDir)) {
        fs.renameSync(tempDir, changesetDir);
      }
    }
  });

  test('checkForChangesetFiles returns false if .changeset directory does not exist', () => {
    // Temporarily rename .changeset if it exists
    const tempDir = changesetDir + '_bak';
    if (fs.existsSync(changesetDir)) {
      fs.renameSync(changesetDir, tempDir);
    }
    try {
      expect(checkForChangesetFiles()).toBe(false);
    } finally {
      // Restore .changeset directory
      if (fs.existsSync(tempDir)) {
        fs.renameSync(tempDir, changesetDir);
      }
    }
  });
});

// Placeholder for changesets tests
// Move or create tests for src/changeset/changesets.ts here.
