import fs from 'fs';

import { describe, test, expect } from 'vitest';

import { createChangesetFile } from '../../src/changeset';

describe('createChangesetFile', () => {
  test('should be defined', () => {
    expect(createChangesetFile).toBeDefined();
  });

  test('should create a changeset file with correct content', () => {
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

  test('should use default description if not provided', () => {
    const packageName = 'my-package';
    const changeType = 'patch';
    const filePath = createChangesetFile(packageName, changeType);
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('No description provided.');
    fs.unlinkSync(filePath);
  });

  test('should trim whitespace from packageName and description', () => {
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

  test('should create .changeset directory if it does not exist', () => {
    const changesetDir = '.changeset';
    if (fs.existsSync(changesetDir)) {
      fs.rmdirSync(changesetDir, { recursive: true });
    }
    const filePath = createChangesetFile('pkg', 'minor', 'desc');
    expect(fs.existsSync(changesetDir)).toBe(true);
    expect(fs.existsSync(filePath)).toBe(true);
    fs.unlinkSync(filePath);
    fs.rmdirSync(changesetDir, { recursive: true });
  });

  test('should throw if unable to create file', () => {
    const originalWriteFileSync = fs.writeFileSync;
    fs.writeFileSync = () => {
      throw new Error('FS error');
    };
    expect(() => createChangesetFile('pkg', 'minor', 'desc')).toThrow('FS error');
    fs.writeFileSync = originalWriteFileSync;
  });

  test('should return file path with expected pattern', () => {
    const filePath = createChangesetFile('pkg', 'minor', 'desc');
    expect(filePath).toMatch(/\.changeset\/auto-generated-at-\d+\.md$/);
    fs.unlinkSync(filePath);
  });
});
