import fs from 'fs';

import { describe, test, expect } from 'vitest';

import {
  checkForChangesetFiles,
  getChangesetFiles,
  isChangesetFile,
  changesetDir,
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
