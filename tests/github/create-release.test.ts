import fs from 'fs/promises';

import { describe, test, expect, vi, beforeEach } from 'vitest';

import { createRelease } from '../../src/github/create-release';

vi.mock('fs/promises');

describe('createRelease', () => {
  let mockOctokit: any;
  let mockFs: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFs = vi.mocked(fs);

    mockOctokit = {
      repos: {
        createRelease: vi.fn().mockResolvedValue({ data: { id: 123 } }),
      },
    };
  });

  test('creates release with changelog content', async () => {
    const pkg = {
      dir: '/packages/test-pkg',
      packageJson: {
        name: 'test-pkg',
        version: '1.0.0',
        private: false,
      },
    };

    const changelogContent = `# Changelog

## 1.0.0

### Patch Changes

- Added new feature
- Fixed bug

## 0.9.0

### Minor Changes

- Previous version
`;

    mockFs.readFile.mockResolvedValue(changelogContent);

    await createRelease(mockOctokit, {
      pkg,
      tagName: 'test-pkg@1.0.0',
      owner: 'test-owner',
      repo: 'test-repo',
    });

    expect(mockFs.readFile).toHaveBeenCalledWith(
      expect.stringContaining('test-pkg'),
      'utf8',
    );
    expect(mockOctokit.repos.createRelease).toHaveBeenCalledWith({
      owner: 'test-owner',
      repo: 'test-repo',
      name: 'test-pkg@1.0.0',
      tag_name: 'test-pkg@1.0.0',
      body: expect.stringContaining('## [test-pkg@1.0.0](https://github.com/test-owner/test-repo/compare/test-pkg@0.9.0...test-pkg@1.0.0)'),
      prerelease: false,
    });
  });

  test('creates prerelease for version with hyphen', async () => {
    const pkg = {
      dir: '/packages/test-pkg',
      packageJson: {
        name: 'test-pkg',
        version: '1.0.0-beta.1',
        private: false,
      },
    };

    const changelogContent = `# Changelog

## 1.0.0-beta.1

### Major Changes

- Beta feature
`;

    mockFs.readFile.mockResolvedValue(changelogContent);

    await createRelease(mockOctokit, {
      pkg,
      tagName: 'test-pkg@1.0.0-beta.1',
      owner: 'test-owner',
      repo: 'test-repo',
    });

    expect(mockOctokit.repos.createRelease).toHaveBeenCalledWith(
      expect.objectContaining({
        prerelease: true,
      }),
    );
  });

  test('returns early if CHANGELOG.md does not exist', async () => {
    const pkg = {
      dir: '/packages/test-pkg',
      packageJson: {
        name: 'test-pkg',
        version: '1.0.0',
        private: false,
      },
    };

    const error = new Error('ENOENT');
    (error as any).code = 'ENOENT';
    mockFs.readFile.mockRejectedValue(error);

    await createRelease(mockOctokit, {
      pkg,
      tagName: 'test-pkg@1.0.0',
      owner: 'test-owner',
      repo: 'test-repo',
    });

    expect(mockOctokit.repos.createRelease).not.toHaveBeenCalled();
  });

  test('returns early if changelog entry not found', async () => {
    const pkg = {
      dir: '/packages/test-pkg',
      packageJson: {
        name: 'test-pkg',
        version: '1.0.0',
        private: false,
      },
    };

    const changelogContent = `# Changelog

## 0.9.0

### Minor Changes

- Previous version
`;

    mockFs.readFile.mockResolvedValue(changelogContent);

    const result = await createRelease(mockOctokit, {
      pkg,
      tagName: 'test-pkg@1.0.0',
      owner: 'test-owner',
      repo: 'test-repo',
    });

    expect(mockOctokit.repos.createRelease).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  test('detects different change levels correctly', async () => {
    const testCases = [
      { changeLevel: 'Major Changes' },
      { changeLevel: 'Minor Changes' },
      { changeLevel: 'Patch Changes' },
    ];

    for (const { changeLevel } of testCases) {
      const pkg = {
        dir: '/packages/test-pkg',
        packageJson: {
          name: 'test-pkg',
          version: '2.0.0',
          private: false,
        },
      };

      const changelogContent = `# Changelog

## 2.0.0

### ${changeLevel}

- Test change for ${changeLevel}

## 1.0.0

### Patch Changes

- Previous version
`;

      mockFs.readFile.mockResolvedValue(changelogContent);

      await createRelease(mockOctokit, {
        pkg,
        tagName: 'test-pkg@2.0.0',
        owner: 'test-owner',
        repo: 'test-repo',
      });

      expect(mockOctokit.repos.createRelease).toHaveBeenLastCalledWith(
        expect.objectContaining({
          body: expect.stringContaining(`## [test-pkg@2.0.0](https://github.com/test-owner/test-repo/compare/test-pkg@1.0.0...test-pkg@2.0.0)`),
        }),
      );

      vi.clearAllMocks();
      mockOctokit.repos.createRelease = vi.fn().mockResolvedValue({ data: { id: 123 } });
    }
  });

  test('includes comparison link when previous version exists', async () => {
    const pkg = {
      dir: '/packages/test-pkg',
      packageJson: {
        name: 'test-pkg',
        version: '2.0.0',
        private: false,
      },
    };

    const changelogContent = `# Changelog

## 2.0.0

### Major Changes

- Breaking change

## 1.5.0

### Minor Changes

- Previous version
`;

    mockFs.readFile.mockResolvedValue(changelogContent);

    await createRelease(mockOctokit, {
      pkg,
      tagName: 'test-pkg@2.0.0',
      owner: 'test-owner',
      repo: 'test-repo',
    });

    expect(mockOctokit.repos.createRelease).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.stringContaining(
          '## [test-pkg@2.0.0](https://github.com/test-owner/test-repo/compare/test-pkg@1.5.0...test-pkg@2.0.0)',
        ),
      }),
    );

    // Also check that the header is a clickable link
    expect(mockOctokit.repos.createRelease).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.stringContaining('[test-pkg@2.0.0]'),
      }),
    );
  });

  test('works without comparison link when no previous version exists', async () => {
    const pkg = {
      dir: '/packages/test-pkg',
      packageJson: {
        name: 'test-pkg',
        version: '1.0.0',
        private: false,
      },
    };

    const changelogContent = `# Changelog

## 1.0.0

### Major Changes

- Initial release
`;

    mockFs.readFile.mockResolvedValue(changelogContent);

    await createRelease(mockOctokit, {
      pkg,
      tagName: 'test-pkg@1.0.0',
      owner: 'test-owner',
      repo: 'test-repo',
    });

    expect(mockOctokit.repos.createRelease).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.not.stringContaining('**Full Changelog**'),
      }),
    );

    // Check that it shows the release title without link when no previous version
    expect(mockOctokit.repos.createRelease).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.stringContaining('## test-pkg@1.0.0'),
      }),
    );
  });
});
