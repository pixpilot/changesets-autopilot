import { describe, it, beforeEach, expect, vi } from 'vitest';
import { getCommits, Commit } from '../../src/git/get-commits';
import { execSync } from 'child_process';
import * as extractGitTagsModule from '../../src/git/extract-git-tags';

vi.mock('child_process');

const mockedExecSync = execSync as unknown as ReturnType<typeof vi.fn>;

describe('getCommits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('parses multiple commits from git log output', () => {
    const gitLog = [
      'abc123',
      'feat: add feature',
      'body line 1',
      'body line 2',
      'Alice',
      'alice@example.com',
      '2025-08-05T12:00:00Z',
      'tag: v1.0.0',
      '---COMMIT-END---',
      'def456',
      'fix: bug fix',
      '',
      'Bob',
      'bob@example.com',
      '2025-08-04T11:00:00Z',
      'tag: v2.0.0',
      '---COMMIT-END---',
    ].join('\n');
    mockedExecSync.mockReturnValue(gitLog);
    vi.spyOn(extractGitTagsModule, 'extractGitTags').mockImplementation((refs) => refs.includes('v1.0.0') ? ['v1.0.0'] : ['v2.0.0']);
    const commits = getCommits('abc', 'def');
    expect(commits).toHaveLength(2);
    expect(commits[0]).toMatchObject({
      hash: 'abc123',
      message: 'feat: add feature',
      body: 'body line 1\nbody line 2',
      author_name: 'Alice',
      author_email: 'alice@example.com',
      date: '2025-08-05T12:00:00Z',
      refs: 'tag: v1.0.0',
      gitTags: ['v1.0.0'],
    });
    expect(commits[1]).toMatchObject({
      hash: 'def456',
      message: 'fix: bug fix',
      body: '',
      author_name: 'Bob',
      author_email: 'bob@example.com',
      date: '2025-08-04T11:00:00Z',
      refs: 'tag: v2.0.0',
      gitTags: ['v2.0.0'],
    });
  });

  it('returns empty array if git log output is empty', () => {
    mockedExecSync.mockReturnValue('');
    const commits = getCommits();
    expect(commits).toEqual([]);
  });

  it('throws error if execSync fails', () => {
    const error = new Error('git error');
    mockedExecSync.mockImplementation(() => { throw error; });
    expect(() => getCommits()).toThrow('Failed to get commits: git error');
  });
});
