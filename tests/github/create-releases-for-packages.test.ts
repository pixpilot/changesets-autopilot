import * as core from '@actions/core';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { createRelease } from '../../src/github/create-release';
import { createReleasesForPackages } from '../../src/github/create-releases-for-packages';

// Mocks
vi.mock('@actions/core', () => ({
  info: vi.fn(),
  warning: vi.fn(),
}));
vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn().mockImplementation(() => ({})),
}));
vi.mock('../../src/github/create-release', () => ({
  createRelease: vi.fn(),
}));

const githubToken = 'test-token';
const repo = 'owner/repo';
const releasedPackages = [
  { dir: 'pkg1', packageJson: { name: 'pkg1', version: '1.0.0' } },
  { dir: 'pkg2', packageJson: { name: 'pkg2', version: '2.0.0' } },
];

describe('createReleasesForPackages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call createRelease for each package', async () => {
    await createReleasesForPackages({ releasedPackages, githubToken, repo });
    expect(createRelease).toHaveBeenCalledTimes(releasedPackages.length);
    expect(core.info).toHaveBeenCalledWith(
      'Creating GitHub releases for published packages...',
    );
    expect(core.info).toHaveBeenCalledWith('Created GitHub release for pkg1@1.0.0');
    expect(core.info).toHaveBeenCalledWith('Created GitHub release for pkg2@2.0.0');
  });

  it('should handle errors from createRelease', async () => {
    vi.mocked(createRelease).mockImplementationOnce(() => {
      throw new Error('fail');
    });
    await createReleasesForPackages({ releasedPackages, githubToken, repo });
    expect(core.warning).toHaveBeenCalledWith(
      expect.stringContaining('Failed to create release for pkg1@1.0.0: Error: fail'),
    );
  });
});
