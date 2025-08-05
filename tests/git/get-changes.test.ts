import { describe, test, expect, vi } from 'vitest';

describe('getChangesSinceLastCommit', () => {
  test('should be a function', async () => {
    vi.doMock('@changesets/get-release-plan', () => ({
      default: vi.fn().mockResolvedValue({
        releases: [],
        changesets: [],
        preState: undefined,
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
    vi.doMock('@changesets/get-release-plan', () => ({
      default: vi.fn().mockResolvedValue({
        releases: [],
        changesets: [],
        preState: undefined,
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
    vi.doMock('@changesets/get-release-plan', () => ({
      default: vi.fn().mockRejectedValue(new Error('Mock error')),
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
    vi.doMock('@changesets/get-release-plan', () => ({
      default: vi.fn().mockResolvedValue({
        releases: [
          {
            name: 'pkg-a',
            type: 'minor',
            oldVersion: '1.0.0',
            newVersion: '1.1.0',
            changesets: ['changeset1'],
          },
          {
            name: 'pkg-b',
            type: 'patch',
            oldVersion: '1.0.0',
            newVersion: '1.0.1',
            changesets: ['changeset1'],
          },
        ],
        changesets: [
          {
            id: 'changeset1',
            summary: 'Add new feature',
            releases: [
              { name: 'pkg-a', type: 'minor' },
              { name: 'pkg-b', type: 'patch' },
            ],
          },
        ],
        preState: undefined,
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

  test('should include changeset information for packages', async () => {
    const pkgADir = normalizePath(`${process.cwd()}/packages/pkg-a`);
    vi.doMock('@changesets/get-release-plan', () => ({
      default: vi.fn().mockResolvedValue({
        releases: [
          {
            name: 'pkg-a',
            type: 'minor',
            oldVersion: '1.0.0',
            newVersion: '1.1.0',
            changesets: ['changeset1'],
          },
        ],
        changesets: [
          {
            id: 'changeset1',
            summary: 'Add new feature',
            releases: [{ name: 'pkg-a', type: 'minor' }],
          },
        ],
        preState: undefined,
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
    expect(result['pkg-a'].commits[0].message).toBe('Add new feature');
    expect(result['pkg-a'].commits[0].hash).toBe('changeset1');
    vi.resetModules();
  });

  test('should handle releases with no version change', async () => {
    vi.doMock('@changesets/get-release-plan', () => ({
      default: vi.fn().mockResolvedValue({
        releases: [
          {
            name: 'pkg-a',
            type: 'none',
            oldVersion: '1.0.0',
            newVersion: '1.0.0',
            changesets: [],
          },
        ],
        changesets: [],
        preState: undefined,
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

  test('should handle empty release plan', async () => {
    vi.doMock('@changesets/get-release-plan', () => ({
      default: vi.fn().mockResolvedValue({
        releases: [],
        changesets: [],
        preState: undefined,
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
    expect(result).toEqual({});
    vi.resetModules();
  });

  test('should handle multiple packages with different change types', async () => {
    const pkgADir = normalizePath(`${process.cwd()}/packages/pkg-a`);
    const pkgBDir = normalizePath(`${process.cwd()}/packages/pkg-b`);
    vi.doMock('@changesets/get-release-plan', () => ({
      default: vi.fn().mockResolvedValue({
        releases: [
          {
            name: 'pkg-a',
            type: 'major',
            oldVersion: '1.0.0',
            newVersion: '2.0.0',
            changesets: ['changeset1'],
          },
          {
            name: 'pkg-b',
            type: 'patch',
            oldVersion: '1.0.0',
            newVersion: '1.0.1',
            changesets: ['changeset2'],
          },
        ],
        changesets: [
          {
            id: 'changeset1',
            summary: 'Breaking change',
            releases: [{ name: 'pkg-a', type: 'major' }],
          },
          {
            id: 'changeset2',
            summary: 'Bug fix',
            releases: [{ name: 'pkg-b', type: 'patch' }],
          },
        ],
        preState: undefined,
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
            packageJson: { name: 'pkg-b', version: '1.0.0', private: false },
          },
        ],
      }),
    }));
    vi.resetModules();
    const { getChangesSinceLastCommit } = await import('../../src/git/get-changes');
    const result = await getChangesSinceLastCommit();
    expect(result['pkg-a'].commits[0].message).toBe('Breaking change');
    expect(result['pkg-b'].commits[0].message).toBe('Bug fix');
    expect(result['pkg-a'].version).toBe('1.0.0');
    expect(result['pkg-b'].version).toBe('1.0.0');
    vi.resetModules();
  });
});
