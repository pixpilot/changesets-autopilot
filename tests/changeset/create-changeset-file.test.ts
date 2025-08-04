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
});
