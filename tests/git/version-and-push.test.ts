import { execSync } from 'child_process';

import * as core from '@actions/core';
import { getPackages } from '@manypkg/get-packages';
import type { SimpleGit } from 'simple-git';
import { describe, test, expect, vi, beforeEach } from 'vitest';

import { gitVersionAndPush } from '../../src/git/version-and-push';
import { DEFAULT_RELEASE_COMMIT_MESSAGE } from '../../src/constants/release-commit-message';

// Mock child_process
vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

// Mock @manypkg/get-packages
vi.mock('@manypkg/get-packages', () => ({
  getPackages: vi.fn(),
}));

// Mock get-changes
vi.mock('../../src/git/get-changes', () => ({
  getChangesSinceLastCommit: vi.fn(),
}));

const GITHUB_REPOSITORY = 'owner/repo';
const GITHUB_REF_NAME = 'main';
const GITHUB_TOKEN = 'gh_token';

function createMockGit() {
  return {
    add: vi.fn().mockResolvedValue(undefined),
    commit: vi.fn().mockResolvedValue(undefined),
    push: vi.fn().mockResolvedValue(undefined),
  } as unknown as SimpleGit;
}

describe('gitVersionAndPush', () => {
  let mockGit: SimpleGit;
  let mockExecSync: ReturnType<typeof vi.mocked<typeof execSync>>;
  let mockGetPackages: ReturnType<typeof vi.mocked<typeof getPackages>>;

  beforeEach(() => {
    mockGit = createMockGit();
    mockExecSync = vi.mocked(execSync);
    mockGetPackages = vi.mocked(getPackages);

    vi.spyOn(core, 'info').mockImplementation(() => {});
    vi.spyOn(core, 'warning').mockImplementation(() => {});

    process.env.GITHUB_REPOSITORY = GITHUB_REPOSITORY;
    process.env.GITHUB_REF_NAME = GITHUB_REF_NAME;

    // Default mock returns
    mockExecSync.mockReturnValue('version output' as any);
  });

  test('should create single package commit message with version', async () => {
    // Mock single package scenario
    mockGetPackages.mockResolvedValue({
      packages: [
        {
          dir: '/test/package',
          packageJson: {
            name: 'test-package',
            version: '1.2.3',
            private: false,
          },
        },
      ],
    } as any);

    // Mock that this package has changes
    const { getChangesSinceLastCommit } = await import('../../src/git/get-changes');
    vi.mocked(getChangesSinceLastCommit).mockResolvedValue({
      'test-package': {
        files: ['test-package/src/index.ts'],
        commits: [],
        version: '1.2.3',
        private: false,
      },
    } as any);

    await gitVersionAndPush(mockGit, GITHUB_TOKEN);

    expect(mockGit.commit).toHaveBeenCalledWith('chore(release): 1.2.3 [skip ci]');
  });

  test('should create multi-package commit message with versions in body', async () => {
    // Mock multi-package scenario
    mockGetPackages.mockResolvedValue({
      packages: [
        {
          dir: '/test/package1',
          packageJson: {
            name: 'package1',
            version: '1.0.3',
            private: false,
          },
        },
        {
          dir: '/test/package2',
          packageJson: {
            name: 'package2',
            version: '1.0.4',
            private: false,
          },
        },
      ],
    } as any);

    // Mock that both packages have changes
    const { getChangesSinceLastCommit } = await import('../../src/git/get-changes');
    vi.mocked(getChangesSinceLastCommit).mockResolvedValue({
      package1: {
        files: ['package1/src/index.ts'],
        commits: [],
        version: '1.0.3',
        private: false,
      },
      package2: {
        files: ['package2/src/index.ts'],
        commits: [],
        version: '1.0.4',
        private: false,
      },
    } as any);

    await gitVersionAndPush(mockGit, GITHUB_TOKEN);

    const expectedCommitMessage = `${DEFAULT_RELEASE_COMMIT_MESSAGE}

package1@1.0.3
package2@1.0.4`;

    expect(mockGit.commit).toHaveBeenCalledWith(expectedCommitMessage);
  });

  test('should filter out private packages', async () => {
    // Mock scenario with private packages
    mockGetPackages.mockResolvedValue({
      packages: [
        {
          dir: '/test/package1',
          packageJson: {
            name: 'package1',
            version: '1.0.3',
            private: false,
          },
        },
        {
          dir: '/test/private-package',
          packageJson: {
            name: 'private-package',
            version: '1.0.0',
            private: true,
          },
        },
      ],
    } as any);

    // Mock that only the public package has changes
    const { getChangesSinceLastCommit } = await import('../../src/git/get-changes');
    vi.mocked(getChangesSinceLastCommit).mockResolvedValue({
      package1: {
        files: ['package1/src/index.ts'],
        commits: [],
        version: '1.0.3',
        private: false,
      },
    } as any);

    await gitVersionAndPush(mockGit, GITHUB_TOKEN);

    expect(mockGit.commit).toHaveBeenCalledWith('chore(release): 1.0.3 [skip ci]');
  });

  test('should use default message if getPackages fails', async () => {
    mockGetPackages.mockRejectedValue(new Error('Failed to get packages'));

    await gitVersionAndPush(mockGit, GITHUB_TOKEN);

    expect(mockGit.commit).toHaveBeenCalledWith(DEFAULT_RELEASE_COMMIT_MESSAGE);
  });

  test('should use default message when no packages have changes', async () => {
    // Mock packages but no changes
    mockGetPackages.mockResolvedValue({
      packages: [
        {
          dir: '/test/package1',
          packageJson: {
            name: 'package1',
            version: '1.0.3',
            private: false,
          },
        },
      ],
    } as any);

    // Mock empty changes (no packages changed)
    const { getChangesSinceLastCommit } = await import('../../src/git/get-changes');
    vi.mocked(getChangesSinceLastCommit).mockResolvedValue({});

    await gitVersionAndPush(mockGit, GITHUB_TOKEN);

    expect(mockGit.commit).toHaveBeenCalledWith(DEFAULT_RELEASE_COMMIT_MESSAGE);
  });

  test('should only include changed packages in monorepo commit message', async () => {
    // Mock monorepo with multiple packages
    mockGetPackages.mockResolvedValue({
      packages: [
        {
          dir: '/test/package1',
          packageJson: {
            name: 'package1',
            version: '1.0.3',
            private: false,
          },
        },
        {
          dir: '/test/package2',
          packageJson: {
            name: 'package2',
            version: '1.0.4',
            private: false,
          },
        },
        {
          dir: '/test/package3',
          packageJson: {
            name: 'package3',
            version: '1.0.5',
            private: false,
          },
        },
      ],
    } as any);

    // Mock that only package1 and package3 have changes (package2 is not changed)
    const { getChangesSinceLastCommit } = await import('../../src/git/get-changes');
    vi.mocked(getChangesSinceLastCommit).mockResolvedValue({
      package1: {
        files: ['package1/src/index.ts'],
        commits: [],
        version: '1.0.3',
        private: false,
      },
      package3: {
        files: ['package3/src/index.ts'],
        commits: [],
        version: '1.0.5',
        private: false,
      },
    } as any);

    await gitVersionAndPush(mockGit, GITHUB_TOKEN);

    const expectedCommitMessage = `${DEFAULT_RELEASE_COMMIT_MESSAGE}

package1@1.0.3
package3@1.0.5`;

    expect(mockGit.commit).toHaveBeenCalledWith(expectedCommitMessage);
  });

  test('should handle changeset version failure', async () => {
    mockExecSync.mockImplementation(() => {
      throw new Error('Changeset version failed');
    });

    await gitVersionAndPush(mockGit, GITHUB_TOKEN);

    expect(mockGit.add).not.toHaveBeenCalled();
    expect(mockGit.commit).not.toHaveBeenCalled();
    expect(mockGit.push).not.toHaveBeenCalled();
  });
});
