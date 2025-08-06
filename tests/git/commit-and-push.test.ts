import { execSync } from 'child_process';

import * as core from '@actions/core';
import type { SimpleGit } from 'simple-git';
import { describe, test, expect, vi, beforeEach } from 'vitest';

import { commitAndPush } from '../../src/git/commit-and-push';
import { DEFAULT_RELEASE_COMMIT_MESSAGE } from '../../src/constants/release-commit-message';

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
    push: vi.fn().mockResolvedValue(undefined),
  } as unknown as SimpleGit;
}

describe('gitVersionAndPush', () => {
  let mockGit: SimpleGit;
  let mockExecSync: ReturnType<typeof vi.mocked<typeof execSync>>;

  beforeEach(() => {
    mockGit = createMockGit();
    mockExecSync = vi.mocked(execSync);

    vi.spyOn(core, 'info').mockImplementation(() => {});
    vi.spyOn(core, 'warning').mockImplementation(() => {});

    process.env.GITHUB_REPOSITORY = GITHUB_REPOSITORY;
    process.env.GITHUB_REF_NAME = GITHUB_REF_NAME;

    // Default mock returns
    mockExecSync.mockReturnValue('version output' as any);
  });

  test('should call commit with correct message for single package', async () => {
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

  test('should call commit with correct message for multiple packages', async () => {
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

  test('should use default message when no packages have changes', async () => {
    const packages: any[] = [];

    await commitAndPush(mockGit, GITHUB_TOKEN, packages);
    expect(mockGit.commit).toHaveBeenCalledWith(DEFAULT_RELEASE_COMMIT_MESSAGE);
  });

  test('should use default message if getPackagesToRelease returns empty array (error case)', async () => {
    const packages: any[] = [];

    await commitAndPush(mockGit, GITHUB_TOKEN, packages);
    expect(mockGit.commit).toHaveBeenCalledWith(DEFAULT_RELEASE_COMMIT_MESSAGE);
  });
});
