import { execSync } from 'child_process';

import * as core from '@actions/core';
import { describe, test, expect, vi, beforeEach } from 'vitest';

import { publishPackages } from '../../src/publisher/publish-packages';

vi.mock('@actions/core');
vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

vi.mock('@manypkg/get-packages', () => ({
  getPackages: vi.fn(),
}));

describe('publishPackages', () => {
  const npmToken = 'test-token';
  let mockGetPackages: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const getPackagesModule = await import('@manypkg/get-packages');
    mockGetPackages = vi.mocked(getPackagesModule.getPackages);

    // Default mock for getPackages - return the same packages before and after publish
    mockGetPackages.mockResolvedValue({
      packages: [
        {
          dir: '/packages/pkg-a',
          packageJson: { name: 'pkg-a', version: '1.0.0', private: false },
        },
      ],
    });
  });

  test('publishes with tag if channel is provided', async () => {
    const branchConfig = { name: 'next', isMatch: true, channel: 'next' };
    const result = await publishPackages(branchConfig, npmToken);
    expect(core.info).toHaveBeenCalledWith(
      expect.stringContaining('npx changeset publish --tag next'),
    );
    expect(execSync).toHaveBeenCalledWith(
      'npx changeset publish --tag next',
      expect.objectContaining({
        env: expect.objectContaining({ NODE_AUTH_TOKEN: npmToken }),
        stdio: 'inherit',
      }),
    );
    expect(Array.isArray(result)).toBe(true);
  });

  test('publishes without tag if channel is not provided', async () => {
    const branchConfig = { name: 'main', isMatch: true };
    const result = await publishPackages(branchConfig, npmToken);
    expect(core.info).toHaveBeenCalledWith(
      expect.stringContaining('npx changeset publish'),
    );
    expect(execSync).toHaveBeenCalledWith(
      'npx changeset publish',
      expect.objectContaining({
        env: expect.objectContaining({ NODE_AUTH_TOKEN: npmToken }),
        stdio: 'inherit',
      }),
    );
    expect(Array.isArray(result)).toBe(true);
  });

  test('detects published packages by version changes', async () => {
    const branchConfig = { name: 'main', isMatch: true };

    // Mock getPackages to return different versions before and after publish
    mockGetPackages
      .mockResolvedValueOnce({
        packages: [
          {
            dir: '/packages/pkg-a',
            packageJson: { name: 'pkg-a', version: '1.0.0', private: false },
          },
          {
            dir: '/packages/pkg-b',
            packageJson: { name: 'pkg-b', version: '2.0.0', private: false },
          },
        ],
      })
      .mockResolvedValueOnce({
        packages: [
          {
            dir: '/packages/pkg-a',
            packageJson: { name: 'pkg-a', version: '1.0.1', private: false }, // version changed
          },
          {
            dir: '/packages/pkg-b',
            packageJson: { name: 'pkg-b', version: '2.0.0', private: false }, // no change
          },
        ],
      });

    const result = await publishPackages(branchConfig, npmToken);
    expect(result).toHaveLength(1);
    expect(result[0].packageJson.name).toBe('pkg-a');
    expect(result[0].packageJson.version).toBe('1.0.1');
  });

  test('excludes private packages from released packages', async () => {
    const branchConfig = { name: 'main', isMatch: true };

    mockGetPackages.mockResolvedValue({
      packages: [
        {
          dir: '/packages/pkg-a',
          packageJson: { name: 'pkg-a', version: '1.0.0', private: true },
        },
        {
          dir: '/packages/pkg-b',
          packageJson: { name: 'pkg-b', version: '2.0.0', private: false },
        },
      ],
    });

    const result = await publishPackages(branchConfig, npmToken);
    expect(result).toHaveLength(0); // No packages should be returned since no versions changed
  });
});
