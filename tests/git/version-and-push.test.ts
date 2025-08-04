import * as child_process from 'child_process';

import * as core from '@actions/core';
import type { SimpleGit } from 'simple-git';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

import { gitVersionAndPush } from '../../src/git/version-and-push';

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
  let coreInfoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockGit = createMockGit();
    vi.mock('child_process', () => ({
      execSync: vi.fn(() => undefined),
    }));
    coreInfoSpy = vi.spyOn(core, 'info').mockImplementation(() => {});
    process.env.GITHUB_REPOSITORY = GITHUB_REPOSITORY;
    process.env.GITHUB_REF_NAME = GITHUB_REF_NAME;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.GITHUB_REPOSITORY;
    delete process.env.GITHUB_REF_NAME;
  });

  test('should be a function', () => {
    expect(typeof gitVersionAndPush).toBe('function');
  });

  test('runs version, add, commit, and push with correct args', async () => {
    await gitVersionAndPush(mockGit, GITHUB_TOKEN);
    expect(child_process.execSync).toHaveBeenCalledWith('npm changeset version', {
      stdio: 'inherit',
    });
    expect(mockGit.add).toHaveBeenCalledWith('.');
    expect(mockGit.commit).toHaveBeenCalledWith(
      'chore(release): version packages [skip ci]',
    );
    expect(mockGit.push).toHaveBeenCalledWith(
      `https://${GITHUB_TOKEN}@github.com/${GITHUB_REPOSITORY}.git`,
      `HEAD:${GITHUB_REF_NAME}`,
    );
  });

  test('logs info if commit fails', async () => {
    vi.mocked(mockGit.commit).mockRejectedValueOnce(new Error('fail'));
    await gitVersionAndPush(mockGit, GITHUB_TOKEN);
    expect(coreInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining('No changes to commit or commit failed'),
    );
  });

  test('logs info if env vars are missing', async () => {
    delete process.env.GITHUB_REPOSITORY;
    await gitVersionAndPush(mockGit, GITHUB_TOKEN);
    expect(coreInfoSpy).toHaveBeenCalledWith('Missing repo, token, or refName for push.');
  });

  test('does not push if githubToken is missing', async () => {
    await gitVersionAndPush(mockGit, '');
    expect(mockGit.push).not.toHaveBeenCalled();
    expect(coreInfoSpy).toHaveBeenCalledWith('Missing repo, token, or refName for push.');
  });
});
