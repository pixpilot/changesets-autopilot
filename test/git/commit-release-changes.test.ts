import { beforeEach, describe, expect, it, vi } from 'vitest';
import { commitReleaseChanges } from '../../src/git/commit-release-changes';

const mockGit = {
  add: vi.fn().mockResolvedValue(undefined),
  commit: vi.fn().mockResolvedValue(undefined),
};

vi.mock('../../src/utils/get-release-commit-message', () => ({
  getReleaseCommitMessage: vi.fn(() => 'release commit'),
}));

// Mock @actions/core
vi.mock('@actions/core', () => ({
  info: vi.fn(),
}));

describe('commitReleaseChanges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockPackages = [{ name: 'pkg-a', version: '1.0.0', type: 'patch' as const }];

  it('commits changes with correct message', async () => {
    const msg = await commitReleaseChanges(mockGit as any, mockPackages);
    expect(mockGit.add).toHaveBeenCalledWith('.');
    expect(mockGit.commit).toHaveBeenCalledWith('release commit');
    expect(msg).toBe('release commit');
  });

  it('throws if commit fails', async () => {
    (mockGit.commit as any).mockRejectedValueOnce(new Error('fail'));
    await expect(commitReleaseChanges(mockGit as any, mockPackages)).rejects.toThrow(
      'Git commit failed: fail',
    );
    // Should still call add
    expect(mockGit.add).toHaveBeenCalled();
  });
});
