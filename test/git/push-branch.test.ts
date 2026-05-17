import process from 'node:process';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pushBranch } from '../../src/git/push-branch';

const mockGit = {
  branch: vi.fn().mockResolvedValue({ current: 'main' }),
  push: vi.fn().mockResolvedValue(undefined),
};

vi.mock('@actions/core', () => ({
  info: vi.fn(),
}));

describe('pushBranch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Restore default mock return values
    mockGit.branch.mockResolvedValue({ current: 'main' });
    mockGit.push.mockResolvedValue(undefined);
    process.env.GITHUB_REPOSITORY = 'owner/repo';
    process.env.GITHUB_REF_NAME = 'main';
  });

  it('pushes to correct branch', async () => {
    await pushBranch(mockGit as any, 'token');
    expect(mockGit.branch).toHaveBeenCalledWith(['--show-current']);
    expect(mockGit.push).toHaveBeenCalledWith(
      'https://token@github.com/owner/repo.git',
      'HEAD:main',
    );
  });

  it('falls back to refName if currentBranch.current is falsy', async () => {
    mockGit.branch.mockResolvedValueOnce({ current: '' });
    await pushBranch(mockGit as any, 'token');
    expect(mockGit.push).toHaveBeenCalledWith(
      'https://token@github.com/owner/repo.git',
      'HEAD:main',
    );
  });

  it('does not push if githubToken is missing', async () => {
    await expect(pushBranch(mockGit as any, '')).rejects.toThrow(
      'Missing repo, token, or refName for push.',
    );
    expect(mockGit.push).not.toHaveBeenCalled();
  });

  it('does not push if refName is missing', async () => {
    process.env.GITHUB_REF_NAME = '';
    await expect(pushBranch(mockGit as any, 'token')).rejects.toThrow(
      'Missing repo, token, or refName for push.',
    );
    expect(mockGit.push).not.toHaveBeenCalled();
  });

  it('throws error if push fails', async () => {
    (mockGit.push as any).mockRejectedValueOnce(new Error('fail'));
    await expect(pushBranch(mockGit as any, 'token')).rejects.toThrow(
      'Git push failed: fail',
    );
    expect(mockGit.branch).toHaveBeenCalled();
  });

  it('throws for missing env vars', async () => {
    process.env.GITHUB_REPOSITORY = '';
    await expect(pushBranch(mockGit as any, 'token')).rejects.toThrow(
      'Missing repo, token, or refName for push.',
    );
    // Should not call push
    expect(mockGit.push).not.toHaveBeenCalled();
  });

  it('throws error if branch throws', async () => {
    mockGit.branch.mockRejectedValueOnce(new Error('fail'));
    await expect(pushBranch(mockGit as any, 'token')).rejects.toThrow(
      'Git push failed: fail',
    );
    // Should not call push if branch fails
    expect(mockGit.push).not.toHaveBeenCalled();
  });
});
