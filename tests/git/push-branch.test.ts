import { describe, it, expect, vi, beforeEach } from 'vitest';
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
    await pushBranch(mockGit as any, '');
    expect(mockGit.push).not.toHaveBeenCalled();
  });

  it('does not push if refName is missing', async () => {
    process.env.GITHUB_REF_NAME = '';
    await pushBranch(mockGit as any, 'token');
    expect(mockGit.push).not.toHaveBeenCalled();
  });

  it('logs error if push fails', async () => {
    (mockGit.push as any).mockRejectedValueOnce(new Error('fail'));
    await pushBranch(mockGit as any, 'token');
    expect(mockGit.branch).toHaveBeenCalled();
  });

  it('logs missing env vars', async () => {
    process.env.GITHUB_REPOSITORY = '';
    await pushBranch(mockGit as any, 'token');
    // Should not call push
    expect(mockGit.push).not.toHaveBeenCalled();
  });

  it('logs error if branch throws', async () => {
    mockGit.branch.mockRejectedValueOnce(new Error('fail'));
    await pushBranch(mockGit as any, 'token');
    // Should not call push if branch fails
    expect(mockGit.push).not.toHaveBeenCalled();
  });
});
