import fs from 'fs';
import path from 'path';
import { describe, test, expect } from 'vitest';
import {
  checkForChangesetFiles,
  getChangesetFiles,
  getAllChangesetFiles,
  isChangesetFile,
  isAnyChangesetFile,
  changesetDir,
  hasChangesetFiles,
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

  test('hasChangesetFiles returns false if .changeset directory does not exist', () => {
    const tempDir = changesetDir + '_bak';
    if (fs.existsSync(changesetDir)) {
      fs.renameSync(changesetDir, tempDir);
    }
    try {
      expect(hasChangesetFiles()).toBe(false);
    } finally {
      if (fs.existsSync(tempDir)) {
        fs.renameSync(tempDir, changesetDir);
      }
    }
  });

  test('hasChangesetFiles returns false if only README.md exists', () => {
    if (!fs.existsSync(changesetDir)) fs.mkdirSync(changesetDir);
    fs.writeFileSync(path.join(changesetDir, 'README.md'), '');
    expect(hasChangesetFiles()).toBe(false);
    fs.unlinkSync(path.join(changesetDir, 'README.md'));
    fs.rmSync(changesetDir, { recursive: true, force: true });
  });

  test('hasChangesetFiles returns true if manual changeset file exists', () => {
    if (!fs.existsSync(changesetDir)) fs.mkdirSync(changesetDir);
    fs.writeFileSync(path.join(changesetDir, 'manual.md'), '');
    expect(hasChangesetFiles()).toBe(true);
    fs.unlinkSync(path.join(changesetDir, 'manual.md'));
    fs.rmSync(changesetDir, { recursive: true, force: true });
  });

  test('hasChangesetFiles returns true if auto-generated changeset file exists', () => {
    if (!fs.existsSync(changesetDir)) fs.mkdirSync(changesetDir);
    fs.writeFileSync(path.join(changesetDir, 'auto-generated-at-123.md'), '');
    expect(hasChangesetFiles()).toBe(true);
    fs.unlinkSync(path.join(changesetDir, 'auto-generated-at-123.md'));
    fs.rmSync(changesetDir, { recursive: true, force: true });
  });

  test('hasChangesetFiles returns true if both manual and auto-generated files exist', () => {
    if (!fs.existsSync(changesetDir)) fs.mkdirSync(changesetDir);
    fs.writeFileSync(path.join(changesetDir, 'manual.md'), '');
    fs.writeFileSync(path.join(changesetDir, 'auto-generated-at-123.md'), '');
    expect(hasChangesetFiles()).toBe(true);
    fs.unlinkSync(path.join(changesetDir, 'manual.md'));
    fs.unlinkSync(path.join(changesetDir, 'auto-generated-at-123.md'));
    fs.rmSync(changesetDir, { recursive: true, force: true });
  });
});

// Placeholder for changesets tests
// Move or create tests for src/changeset/changesets.ts here.
