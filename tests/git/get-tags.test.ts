import { execSync } from 'child_process';

import { describe, it, beforeEach, expect, vi } from 'vitest';

import { getTags } from '../../src/git/get-tags';

vi.mock('child_process');

const mockedExecSync = execSync as unknown as ReturnType<typeof vi.fn>;

describe('getTags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns tags from git output', () => {
    mockedExecSync.mockReturnValue('v1.0.0\nv2.0.0\n');
    const tags = getTags('main');
    expect(tags).toEqual(['v1.0.0', 'v2.0.0']);
    expect(mockedExecSync).toHaveBeenCalledWith(
      'git tag --merged main',
      expect.objectContaining({ encoding: 'utf8', stdio: 'pipe' }),
    );
  });

  it('returns empty array if no tags', () => {
    mockedExecSync.mockReturnValue('');
    const tags = getTags('main');
    expect(tags).toEqual([]);
  });

  it('throws error if execSync fails', () => {
    const error = new Error('git error');
    mockedExecSync.mockImplementation(() => {
      throw error;
    });
    expect(() => getTags('main')).toThrow('Failed to get tags: git error');
  });
});
