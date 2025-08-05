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

### Features

- Added new feature
- Fixed bug

## 0.9.0

### Features

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
      body: expect.stringContaining('## 1.0.0'),
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

### Features

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

  test('throws error if changelog entry not found', async () => {
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

### Features

- Previous version
`;

    mockFs.readFile.mockResolvedValue(changelogContent);

    await expect(
      createRelease(mockOctokit, {
        pkg,
        tagName: 'test-pkg@1.0.0',
        owner: 'test-owner',
        repo: 'test-repo',
      }),
    ).rejects.toThrow('Could not find changelog entry for test-pkg@1.0.0');
  });
});
