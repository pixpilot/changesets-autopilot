import fs from 'node:fs';

import { describe, expect, it } from 'vitest';

import { createChangesetFile } from '../../src/changeset';

describe('createChangesetFile', () => {
  it('should be defined', () => {
    expect(createChangesetFile).toBeDefined();
  });

  it('should create a changeset file with correct content', () => {
    const packageName = 'my-package';
    const changeType = 'minor';
    const description = 'Add new feature';
    const filePath = createChangesetFile(packageName, changeType, description);
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain(`'${packageName}': ${changeType}`);
    expect(content).toContain(description);
    // Cleanup
    fs.unlinkSync(filePath);
  });

  it('should use default description if not provided', () => {
    const packageName = 'my-package';
    const changeType = 'patch';
    const filePath = createChangesetFile(packageName, changeType);
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('No description provided.');
    fs.unlinkSync(filePath);
  });

  it('should trim whitespace from packageName and description', () => {
    const packageName = '  spaced-package  ';
    const changeType = 'major';
    const description = '  spaced description  ';
    const filePath = createChangesetFile(packageName, changeType, description);
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain("'spaced-package': major");
    expect(content).toContain('spaced description');
    fs.unlinkSync(filePath);
  });

  it('should create .changeset directory if it does not exist', () => {
    const changesetDir = '.changeset';
    if (fs.existsSync(changesetDir)) {
      fs.rmSync(changesetDir, { recursive: true, force: true });
    }
    const filePath = createChangesetFile('pkg', 'minor', 'desc');
    expect(fs.existsSync(changesetDir)).toBe(true);
    expect(fs.existsSync(filePath)).toBe(true);
    fs.unlinkSync(filePath);
    fs.rmSync(changesetDir, { recursive: true, force: true });
  });

  it('should throw if unable to create file', () => {
    const originalWriteFileSync = fs.writeFileSync;
    fs.writeFileSync = () => {
      throw new Error('FS error');
    };
    expect(() => createChangesetFile('pkg', 'minor', 'desc')).toThrow('FS error');
    fs.writeFileSync = originalWriteFileSync;
  });

  it('should return file path with expected pattern', () => {
    const filePath = createChangesetFile('pkg', 'minor', 'desc');
    expect(filePath).toMatch(/\.changeset\/auto-generated-at-\d+-\d+\.md$/u);
    fs.unlinkSync(filePath);
  });

  it('should not overwrite changesets written within the same millisecond', () => {
    const paths = Array.from({ length: 25 }, (_, index) =>
      createChangesetFile(`pkg-${index}`, 'patch', `change ${index}`),
    );

    expect(new Set(paths).size).toBe(paths.length);
    for (const [index, filePath] of paths.entries()) {
      expect(fs.readFileSync(filePath, 'utf8')).toContain(`'pkg-${index}': patch`);
    }

    for (const filePath of paths) {
      fs.unlinkSync(filePath);
    }
  });

  it('should not reuse a name left over from a previous run', () => {
    const existing = createChangesetFile('pkg', 'patch', 'first');
    fs.writeFileSync(existing, 'stale content');

    // Force the sequence back onto a name that is already on disk.
    const collidingName = existing.replace(/-\d+\.md$/u, '-1.md');
    if (collidingName !== existing) {
      fs.writeFileSync(collidingName, 'stale content');
    }

    const next = createChangesetFile('pkg', 'patch', 'second');
    expect(next).not.toBe(existing);
    expect(fs.readFileSync(next, 'utf8')).toContain('second');
    expect(fs.readFileSync(existing, 'utf8')).toBe('stale content');

    fs.unlinkSync(existing);
    fs.unlinkSync(next);
    if (collidingName !== existing && fs.existsSync(collidingName)) {
      fs.unlinkSync(collidingName);
    }
  });
});
