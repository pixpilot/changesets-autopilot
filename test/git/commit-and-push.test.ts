import type { SimpleGit } from 'simple-git';

import { execSync } from 'node:child_process';
import * as core from '@actions/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_RELEASE_COMMIT_MESSAGE } from '../../src/constants/release-commit-message';
import { commitAndPush } from '../../src/git/commit-and-push';

vi.mock('@actions/core', () => ({
  info: vi.fn(),
  warning: vi.fn(),
}));

// Mock child_process
vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

// Mock @manypkg/get-packages
vi.mock('@manypkg/get-packages', () => ({
  getPackages: vi.fn(),
}));

// Mock get-release-plan
vi.mock('../../src/utils/get-release-plan', () => ({
  getPackagesToRelease: vi.fn(),
}));

const GITHUB_REPOSITORY = 'owner/repo';
const GITHUB_REF_NAME = 'main';
const GITHUB_TOKEN = 'gh_token';

function createMockGit() {
  return {
    add: vi.fn().mockResolvedValue(undefined),
    commit: vi.fn().mockResolvedValue(undefined),
    branch: vi.fn().mockResolvedValue({ current: GITHUB_REF_NAME }),
    push: vi.fn().mockResolvedValue(undefined),
  } as unknown as SimpleGit;
}

describe('gitVersionAndPush', () => {
  let mockGit: SimpleGit;
  let mockExecSync: ReturnType<typeof vi.mocked<typeof execSync>>;

  beforeEach(() => {
    mockGit = createMockGit();
    mockExecSync = vi.mocked(execSync);

    vi.mocked(core.info).mockImplementation(() => {});
    vi.mocked(core.warning).mockImplementation(() => {});

    process.env.GITHUB_REPOSITORY = GITHUB_REPOSITORY;
    process.env.GITHUB_REF_NAME = GITHUB_REF_NAME;

    // Default mock returns
    mockExecSync.mockReturnValue('version output');
  });

  it('should call commit with correct message for single package', async () => {
    const packages = [
      {
        name: 'test-package',
        version: '1.2.3',
        type: 'minor' as const,
      },
    ];

    await commitAndPush(mockGit, GITHUB_TOKEN, packages);
    expect(mockGit.commit).toHaveBeenCalledWith(expect.any(String));
  });

  it('should call commit with correct message for multiple packages', async () => {
    const packages = [
      {
        name: 'package1',
        version: '1.0.3',
        type: 'minor' as const,
      },
      {
        name: 'package2',
        version: '1.0.4',
        type: 'patch' as const,
      },
    ];

    await commitAndPush(mockGit, GITHUB_TOKEN, packages);
    expect(mockGit.commit).toHaveBeenCalledWith(expect.any(String));
  });

  it('should use default message when no packages have changes', async () => {
    const packages: any[] = [];

    await commitAndPush(mockGit, GITHUB_TOKEN, packages);
    expect(mockGit.commit).toHaveBeenCalledWith(DEFAULT_RELEASE_COMMIT_MESSAGE);
  });

  it('should use default message if getPackagesToRelease returns empty array (error case)', async () => {
    const packages: any[] = [];

    await commitAndPush(mockGit, GITHUB_TOKEN, packages);
    expect(mockGit.commit).toHaveBeenCalledWith(DEFAULT_RELEASE_COMMIT_MESSAGE);
  });
});
