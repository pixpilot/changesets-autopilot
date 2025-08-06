import { describe, test, expect, vi } from 'vitest';

import { findLastPublishedCommit } from '../../src/git/find-last-published-commit';

describe('findLastPublishedCommit', () => {
  test('returns tag if version tag exists', async () => {
    vi.doMock('@actions/core', () => ({
      info: vi.fn(),
      warning: vi.fn(),
    }));
    const tags = { all: ['v1.2.3', 'not-a-tag'], latest: 'v1.2.3' };
    const git = {
      tags: vi.fn().mockResolvedValue(tags),
      log: vi.fn(),
    } as any;
    const result = await findLastPublishedCommit(git);
    expect(result).toBe('v1.2.3');
  });

  test('returns commit hash if no version tag but published commit exists', async () => {
    vi.doMock('@actions/core', () => ({
      info: vi.fn(),
      warning: vi.fn(),
    }));
    const tags = { all: [], latest: null };
    const log = {
      all: [
        { hash: 'abc123', message: 'chore(release): version packages [skip ci]' },
        { hash: 'def456', message: 'feat: add new feature' },
      ],
    };
    const git = {
      tags: vi.fn().mockResolvedValue(tags),
      log: vi.fn().mockResolvedValue(log),
    } as any;
    const result = await findLastPublishedCommit(git);
    expect(result).toBe('abc123');
  });

  test('returns previous commit hash if no published commit but publishable commit exists', async () => {
    vi.doMock('@actions/core', () => ({
      info: vi.fn(),
      warning: vi.fn(),
    }));
    const tags = { all: [], latest: null };
    const log = {
      all: [
        { hash: 'def456', message: 'feat: add new feature' },
        { hash: 'ghi789', message: 'fix: bug fix' },
      ],
    };
    const git = {
      tags: vi.fn().mockResolvedValue(tags),
      log: vi.fn().mockResolvedValue(log),
    } as any;
    const result = await findLastPublishedCommit(git);
    expect(result).toBe('ghi789');
  });

  test('returns HEAD~1 if no tags or publishable commits found', async () => {
    vi.doMock('@actions/core', () => ({
      info: vi.fn(),
      warning: vi.fn(),
    }));
    const tags = { all: [], latest: null };
    const log = {
      all: [{ hash: 'abc123', message: 'chore: something irrelevant' }],
    };
    const git = {
      tags: vi.fn().mockResolvedValue(tags),
      log: vi.fn().mockResolvedValue(log),
    } as any;
    const result = await findLastPublishedCommit(git);
    expect(result).toBe('HEAD~1');
  });

  test('returns HEAD~1 on error', async () => {
    vi.doMock('@actions/core', () => ({
      info: vi.fn(),
      warning: vi.fn(),
    }));
    const git = {
      tags: vi.fn().mockRejectedValue(new Error('fail')), // simulate error
      log: vi.fn(),
    } as any;
    const result = await findLastPublishedCommit(git);
    expect(result).toBe('HEAD~1');
  });
});
