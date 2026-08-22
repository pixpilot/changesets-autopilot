import { describe, expect, it, vi } from 'vitest';

import { findLastPublishedCommit } from '../../src/git/find-last-published-commit';

describe('findLastPublishedCommit', () => {
  it('returns tag if version tag exists', async () => {
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

  it('returns a monorepo package tag as base', async () => {
    vi.doMock('@actions/core', () => ({
      info: vi.fn(),
      warning: vi.fn(),
    }));
    const tags = {
      all: ['nightly', '@scope/pkg-b@2.1.0', 'pkg-a@1.0.0'],
      latest: null,
    };
    const git = {
      tags: vi.fn().mockResolvedValue(tags),
      log: vi.fn(),
    } as any;
    const result = await findLastPublishedCommit(git);
    expect(result).toBe('@scope/pkg-b@2.1.0');
  });

  it('returns a prerelease tag as base', async () => {
    vi.doMock('@actions/core', () => ({
      info: vi.fn(),
      warning: vi.fn(),
    }));
    const tags = { all: ['pkg-a@1.0.0-rc.3'], latest: null };
    const git = {
      tags: vi.fn().mockResolvedValue(tags),
      log: vi.fn(),
    } as any;
    const result = await findLastPublishedCommit(git);
    expect(result).toBe('pkg-a@1.0.0-rc.3');
  });

  it('sorts tags by date so the newest release wins, not the highest refname', async () => {
    vi.doMock('@actions/core', () => ({
      info: vi.fn(),
      warning: vi.fn(),
    }));
    const git = {
      tags: vi.fn().mockResolvedValue({ all: [], latest: null }),
      log: vi.fn().mockResolvedValue({ all: [] }),
      revparse: vi.fn().mockResolvedValue('HEAD~1'),
    } as any;
    await findLastPublishedCommit(git);
    expect(git.tags).toHaveBeenCalledWith(['--sort=-creatordate', '--merged']);
  });

  it('ignores tags that are not version tags', async () => {
    vi.doMock('@actions/core', () => ({
      info: vi.fn(),
      warning: vi.fn(),
    }));
    const tags = { all: ['latest', 'release-candidate', 'pkg@1.2'], latest: null };
    const git = {
      tags: vi.fn().mockResolvedValue(tags),
      log: vi.fn().mockResolvedValue({
        all: [{ hash: 'abc123', message: 'chore(release): version packages [skip ci]' }],
      }),
    } as any;
    const result = await findLastPublishedCommit(git);
    expect(result).toBe('abc123');
  });

  it('returns commit hash if no version tag but published commit exists', async () => {
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

  it('returns previous commit hash if no published commit but publishable commit exists', async () => {
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

  it('returns HEAD~1 if no tags or publishable commits found and parent exists', async () => {
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
      revparse: vi.fn().mockResolvedValueOnce('HEAD~1').mockResolvedValueOnce('HEAD~1'),
    } as any;
    const result = await findLastPublishedCommit(git);
    expect(result).toBe('HEAD~1');
  });

  it('returns HEAD hash when HEAD~1 is unavailable', async () => {
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
      revparse: vi
        .fn()
        .mockRejectedValueOnce(new Error('no parent'))
        .mockResolvedValueOnce('abc123'),
    } as any;
    const result = await findLastPublishedCommit(git);
    expect(result).toBe('abc123');
  });

  it('returns HEAD hash on error when HEAD~1 is unavailable', async () => {
    vi.doMock('@actions/core', () => ({
      info: vi.fn(),
      warning: vi.fn(),
    }));
    const git = {
      tags: vi.fn().mockRejectedValue(new Error('fail')), // simulate error
      log: vi.fn(),
      revparse: vi
        .fn()
        .mockRejectedValueOnce(new Error('no parent'))
        .mockResolvedValueOnce('abc123'),
    } as any;
    const result = await findLastPublishedCommit(git);
    expect(result).toBe('abc123');
  });
});
