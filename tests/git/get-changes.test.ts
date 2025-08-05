import { describe, test, expect, vi } from 'vitest';

describe('getChangesSinceLastCommit', () => {
  test('should be a function', async () => {
    vi.doMock('simple-git', () => ({
      default: () => ({
        diff: vi.fn().mockResolvedValue(''),
        log: vi.fn().mockResolvedValue({ all: [] }),
        tags: vi.fn().mockResolvedValue({ latest: null }),
      }),
    }));
    vi.doMock('@manypkg/get-packages', () => ({
      getPackages: vi.fn().mockResolvedValue({ packages: [] }),
    }));
    vi.resetModules();
    const { getChangesSinceLastCommit } = await import('../../src/git/get-changes');
    expect(typeof getChangesSinceLastCommit).toBe('function');
    vi.resetModules();
  });

  test('should return an object', async () => {
    vi.doMock('simple-git', () => ({
      default: () => ({
        diff: vi.fn().mockResolvedValue(''),
        log: vi.fn().mockResolvedValue({ all: [] }),
        tags: vi.fn().mockResolvedValue({ latest: null }),
      }),
    }));
    vi.doMock('@manypkg/get-packages', () => ({
      getPackages: vi.fn().mockResolvedValue({ packages: [] }),
    }));
    vi.resetModules();
    const { getChangesSinceLastCommit } = await import('../../src/git/get-changes');
    const result = await getChangesSinceLastCommit();
    expect(typeof result).toBe('object');
    expect(result).not.toBeNull();
    vi.resetModules();
  });

  test('should handle errors gracefully', async () => {
    vi.doMock('simple-git', () => ({
      default: () => ({
        diff: vi.fn().mockRejectedValue(new Error('Mock error')),
        log: vi.fn().mockResolvedValue({ all: [] }),
        tags: vi.fn().mockResolvedValue({ latest: null }),
      }),
    }));
    vi.doMock('@manypkg/get-packages', () => ({
      getPackages: vi.fn().mockResolvedValue({ packages: [] }),
    }));
    vi.resetModules();
    const { getChangesSinceLastCommit } = await import('../../src/git/get-changes');
    const result = await getChangesSinceLastCommit();
    expect(result).toEqual({});
    vi.resetModules();
  });

  const normalizePath = (p: string) => p.replace(/\\/g, '/');

  test('should exclude private packages from results', async () => {
    const pkgADir = normalizePath(`${process.cwd()}/packages/pkg-a`);
    const pkgBDir = normalizePath(`${process.cwd()}/packages/pkg-b`);
    vi.doMock('simple-git', () => ({
      default: () => ({
        diff: vi.fn().mockResolvedValue('packages/pkg-a/file.js\npackages/pkg-b/file.js'),
        log: vi.fn().mockResolvedValue({ all: [{ message: 'commit' }] }),
        tags: vi.fn().mockResolvedValue({ latest: null }),
      }),
    }));
    vi.doMock('@manypkg/get-packages', () => ({
      getPackages: vi.fn().mockResolvedValue({
        packages: [
          {
            dir: pkgADir,
            packageJson: { name: 'pkg-a', version: '1.0.0', private: false },
          },
          {
            dir: pkgBDir,
            packageJson: { name: 'pkg-b', version: '1.0.0', private: true },
          },
        ],
      }),
    }));
    vi.resetModules();
    const { getChangesSinceLastCommit } = await import('../../src/git/get-changes');
    const result = await getChangesSinceLastCommit();
    expect(result).toHaveProperty('pkg-a');
    expect(result).not.toHaveProperty('pkg-b');
    vi.resetModules();
  });

  test('should include changed files for public packages', async () => {
    const pkgADir = normalizePath(`${process.cwd()}/packages/pkg-a`);
    vi.doMock('simple-git', () => ({
      default: () => ({
        diff: vi.fn().mockResolvedValue('packages/pkg-a/file.js'),
        log: vi.fn().mockResolvedValue({ all: [{ message: 'commit' }] }),
        tags: vi.fn().mockResolvedValue({ latest: null }),
      }),
    }));
    vi.doMock('@manypkg/get-packages', () => ({
      getPackages: vi.fn().mockResolvedValue({
        packages: [
          {
            dir: pkgADir,
            packageJson: { name: 'pkg-a', version: '1.0.0', private: false },
          },
        ],
      }),
    }));
    vi.resetModules();
    const { getChangesSinceLastCommit } = await import('../../src/git/get-changes');
    const result = await getChangesSinceLastCommit();
    expect(result['pkg-a'].files).toContain('packages/pkg-a/file.js');
    expect(result['pkg-a'].commits[0].message).toBe('commit');
    vi.resetModules();
  });

  test('should handle changed file as only package.json', async () => {
    const pkgADir = normalizePath(`${process.cwd()}/packages/pkg-a`);
    vi.doMock('simple-git', () => ({
      default: () => ({
        diff: vi.fn().mockResolvedValue('packages/pkg-a/package.json'),
        log: vi.fn().mockResolvedValue({ all: [{ message: 'commit' }] }),
        tags: vi.fn().mockResolvedValue({ latest: null }),
      }),
    }));
    vi.doMock('@manypkg/get-packages', () => ({
      getPackages: vi.fn().mockResolvedValue({
        packages: [
          {
            dir: pkgADir,
            packageJson: { name: 'pkg-a', version: '1.0.0', private: false },
          },
        ],
      }),
    }));
    vi.resetModules();
    const { getChangesSinceLastCommit } = await import('../../src/git/get-changes');
    const result = await getChangesSinceLastCommit();
    expect(result['pkg-a'].files).toContain('packages/pkg-a/package.json');
    vi.resetModules();
  });

  test('should handle public package with no changed files', async () => {
    vi.doMock('simple-git', () => ({
      default: () => ({
        diff: vi.fn().mockResolvedValue(''),
        log: vi.fn().mockResolvedValue({ all: [{ message: 'commit' }] }),
        tags: vi.fn().mockResolvedValue({ latest: null }),
      }),
    }));
    vi.doMock('@manypkg/get-packages', () => ({
      getPackages: vi.fn().mockResolvedValue({
        packages: [
          {
            dir: 'packages/pkg-a',
            packageJson: { name: 'pkg-a', version: '1.0.0', private: false },
          },
        ],
      }),
    }));
    vi.resetModules();
    const { getChangesSinceLastCommit } = await import('../../src/git/get-changes');
    const result = await getChangesSinceLastCommit();
    expect(result).not.toHaveProperty('pkg-a');
    vi.resetModules();
  });

  test('should handle package with no private field (defaults to false)', async () => {
    const pkgADir = normalizePath(`${process.cwd()}/packages/pkg-a`);
    vi.doMock('simple-git', () => ({
      default: () => ({
        diff: vi.fn().mockResolvedValue('packages/pkg-a/file.js'),
        log: vi.fn().mockResolvedValue({ all: [{ message: 'commit' }] }),
        tags: vi.fn().mockResolvedValue({ latest: null }),
      }),
    }));
    vi.doMock('@manypkg/get-packages', () => ({
      getPackages: vi.fn().mockResolvedValue({
        packages: [{ dir: pkgADir, packageJson: { name: 'pkg-a', version: '1.0.0' } }],
      }),
    }));
    vi.resetModules();
    const { getChangesSinceLastCommit } = await import('../../src/git/get-changes');
    const result = await getChangesSinceLastCommit();
    expect(result['pkg-a'].private).toBe(false);
    vi.resetModules();
  });

  test('should handle multiple public packages with different changes', async () => {
    const pkgADir = normalizePath(`${process.cwd()}/packages/pkg-a`);
    const pkgBDir = normalizePath(`${process.cwd()}/packages/pkg-b`);
    vi.doMock('simple-git', () => ({
      default: () => ({
        diff: vi
          .fn()
          .mockResolvedValue('packages/pkg-a/file.js\npackages/pkg-b/file2.js'),
        log: vi.fn().mockResolvedValue({ all: [{ message: 'commit' }] }),
        tags: vi.fn().mockResolvedValue({ latest: null }),
      }),
    }));
    vi.doMock('@manypkg/get-packages', () => ({
      getPackages: vi.fn().mockResolvedValue({
        packages: [
          {
            dir: pkgADir,
            packageJson: { name: 'pkg-a', version: '1.0.0', private: false },
          },
          {
            dir: pkgBDir,
            packageJson: { name: 'pkg-b', version: '2.0.0', private: false },
          },
        ],
      }),
    }));
    vi.resetModules();
    const { getChangesSinceLastCommit } = await import('../../src/git/get-changes');
    const result = await getChangesSinceLastCommit();
    expect(result['pkg-a'].files).toContain('packages/pkg-a/file.js');
    expect(result['pkg-b'].files).toContain('packages/pkg-b/file2.js');
    expect(result['pkg-a'].version).toBe('1.0.0');
    expect(result['pkg-b'].version).toBe('2.0.0');
    vi.resetModules();
  });

  test('should skip version commits and find publishable commits', async () => {
    const pkgADir = normalizePath(`${process.cwd()}/packages/pkg-a`);
    vi.doMock('simple-git', () => ({
      default: () => ({
        diff: vi.fn().mockResolvedValue('packages/pkg-a/file.js'),
        log: vi
          .fn()
          .mockResolvedValueOnce({
            // First call for findLastPublishableCommit
            all: [
              { hash: 'abc123', message: 'chore(release): version packages [skip ci]' },
              { hash: 'def456', message: 'feat: add new feature' },
              { hash: 'ghi789', message: 'fix: bug fix' },
            ],
          })
          .mockResolvedValueOnce({
            // Second call for getting commits since base
            all: [{ hash: 'def456', message: 'feat: add new feature' }],
          }),
        tags: vi.fn().mockResolvedValue({ latest: null }),
      }),
    }));
    vi.doMock('@manypkg/get-packages', () => ({
      getPackages: vi.fn().mockResolvedValue({
        packages: [
          {
            dir: pkgADir,
            packageJson: { name: 'pkg-a', version: '1.0.0', private: false },
          },
        ],
      }),
    }));
    vi.resetModules();
    const { getChangesSinceLastCommit } = await import('../../src/git/get-changes');
    const result = await getChangesSinceLastCommit();
    expect(result['pkg-a'].commits).toHaveLength(1);
    expect(result['pkg-a'].commits[0].message).toBe('feat: add new feature');
    vi.resetModules();
  });

  test('should use latest tag as base when all recent commits are version commits', async () => {
    const pkgADir = normalizePath(`${process.cwd()}/packages/pkg-a`);
    vi.doMock('simple-git', () => ({
      default: () => ({
        diff: vi.fn().mockResolvedValue('packages/pkg-a/file.js'),
        log: vi
          .fn()
          .mockResolvedValueOnce({
            // First call for findLastPublishableCommit
            all: [
              { hash: 'abc123', message: 'chore(release): version packages [skip ci]' },
              { hash: 'def456', message: 'version packages' },
              { hash: 'ghi789', message: 'bump version to 1.0.0' },
            ],
          })
          .mockResolvedValueOnce({
            // Second call for getting commits since tag
            all: [
              { hash: 'abc123', message: 'chore(release): version packages [skip ci]' },
              { hash: 'jkl012', message: 'feat: add new feature' },
            ],
          }),
        tags: vi.fn().mockResolvedValue({ latest: 'v1.0.0' }),
      }),
    }));
    vi.doMock('@manypkg/get-packages', () => ({
      getPackages: vi.fn().mockResolvedValue({
        packages: [
          {
            dir: pkgADir,
            packageJson: { name: 'pkg-a', version: '1.0.0', private: false },
          },
        ],
      }),
    }));
    vi.resetModules();
    const { getChangesSinceLastCommit } = await import('../../src/git/get-changes');
    const result = await getChangesSinceLastCommit();
    expect(result['pkg-a'].commits).toHaveLength(1);
    expect(result['pkg-a'].commits[0].message).toBe('feat: add new feature');
    vi.resetModules();
  });
});
