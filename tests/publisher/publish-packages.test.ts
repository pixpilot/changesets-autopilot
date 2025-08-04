import { execSync } from 'child_process';

import * as core from '@actions/core';
import { describe, test, expect, vi, beforeEach } from 'vitest';

import { publishPackages } from '../../src/publisher/publish-packages';

vi.mock('@actions/core');
vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

describe('publishPackages', () => {
  const npmToken = 'test-token';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('publishes with tag if channel is provided', () => {
    const branchConfig = { name: 'next', isMatch: true, channel: 'next' };
    publishPackages(branchConfig, npmToken);
    expect(core.info).toHaveBeenCalledWith(
      expect.stringContaining('npm run changeset publish --tag next'),
    );
    expect(execSync).toHaveBeenCalledWith(
      'npm run changeset publish --tag next',
      expect.objectContaining({
        env: expect.objectContaining({ NODE_AUTH_TOKEN: npmToken }),
        stdio: 'inherit',
      }),
    );
  });

  test('publishes without tag if channel is not provided', () => {
    const branchConfig = { name: 'main', isMatch: true };
    publishPackages(branchConfig, npmToken);
    expect(core.info).toHaveBeenCalledWith(
      expect.stringContaining('npm run changeset publish'),
    );
    expect(execSync).toHaveBeenCalledWith(
      'npm run changeset publish',
      expect.objectContaining({
        env: expect.objectContaining({ NODE_AUTH_TOKEN: npmToken }),
        stdio: 'inherit',
      }),
    );
  });
});
