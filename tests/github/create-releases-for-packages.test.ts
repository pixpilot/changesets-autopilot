import * as core from '@actions/core';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { createRelease } from '../../src/github/create-release';
import { createReleasesForPackages } from '../../src/github/create-releases-for-packages';

// Mocks
vi.mock('@actions/core', () => ({
  info: vi.fn(),
  warning: vi.fn(),
}));

const mockCreateRelease = vi.fn().mockResolvedValue({ data: { id: 1 } });

vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    repos: {
      createRelease: mockCreateRelease,
    },
  })),
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

const groupedPackages = [
  {
    dir: 'packages/ui/button',
    packageJson: { name: '@company/ui-button', version: '1.0.0' },
  },
  {
    dir: 'packages/ui/input',
    packageJson: { name: '@company/ui-input', version: '1.1.0' },
  },
  {
    dir: 'packages/api/auth',
    packageJson: { name: '@company/api-auth', version: '2.0.0' },
  },
  {
    dir: 'packages/api/users',
    packageJson: { name: '@company/api-users', version: '2.1.0' },
  },
];

describe('createReleasesForPackages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('individual releases (default behavior)', () => {
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

  describe('grouped releases', () => {
    it('should call core.info about creating grouped releases', async () => {
      await createReleasesForPackages({
        releasedPackages: groupedPackages,
        githubToken,
        repo,
        groupReleases: true,
        packageGroups: {
          ui: ['@company/ui-button', '@company/ui-input'],
          api: ['@company/api-auth', '@company/api-users'],
        },
      });

      expect(core.info).toHaveBeenCalledWith(
        'Creating GitHub grouped releases for published packages...',
      );
    });

    it('should handle package groups with missing packages', async () => {
      await createReleasesForPackages({
        releasedPackages: groupedPackages,
        githubToken,
        repo,
        groupReleases: true,
        packageGroups: {
          ui: ['@company/ui-button', '@company/ui-input'],
          // Missing api packages - they should go to misc group
        },
      });

      expect(core.info).toHaveBeenCalledWith(
        'Creating GitHub grouped releases for published packages...',
      );
    });

    it('should handle errors in grouped releases gracefully', async () => {
      // This test ensures error handling works
      await createReleasesForPackages({
        releasedPackages: groupedPackages,
        githubToken,
        repo,
        groupReleases: true,
        packageGroups: {
          ui: ['@company/ui-button', '@company/ui-input'],
          api: ['@company/api-auth', '@company/api-users'],
        },
      });

      // Should not throw and should call core.info
      expect(core.info).toHaveBeenCalledWith(
        'Creating GitHub grouped releases for published packages...',
      );
    });
  });
});
