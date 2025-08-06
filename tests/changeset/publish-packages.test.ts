import { execSync } from 'child_process';
import fs from 'fs';

import * as core from '@actions/core';
import { describe, test, expect, vi, beforeEach } from 'vitest';

import { publishPackages } from '../../src/changeset/publish-packages';

vi.mock('@actions/core');
vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));
vi.mock('fs');

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

    // Mock fs.existsSync to return false (not in prerelease mode) by default
    vi.mocked(fs.existsSync).mockReturnValue(false);

    // Default mock for getPackages - return test packages
    mockGetPackages.mockResolvedValue({
      packages: [
        {
          dir: '/packages/pkg-a',
          packageJson: { name: 'pkg-a', version: '1.0.0', private: false },
        },
      ],
    });

    // Default mock for execSync - return no published packages output
    vi.mocked(execSync).mockReturnValue('🦋  info Publishing complete');
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
        encoding: 'utf8',
        env: expect.objectContaining({ NODE_AUTH_TOKEN: npmToken }),
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
        encoding: 'utf8',
        env: expect.objectContaining({ NODE_AUTH_TOKEN: npmToken }),
      }),
    );
    expect(Array.isArray(result)).toBe(true);
  });

  test('detects published packages from changeset output', async () => {
    const branchConfig = { name: 'main', isMatch: true };

    // Mock execSync to return changeset publish output showing published packages with "New tag:" format
    vi.mocked(execSync).mockReturnValue(`
🦋  info npm info @pixpilot/pkg-a
🦋  info npm info @pixpilot/pkg-b
🦋  warn @pixpilot/pkg-b is not being published because version 2.0.0 is already published on npm
🦋  info @pixpilot/pkg-a is being published because our local version (1.0.1) has not been published on npm
🦋  info Publishing "@pixpilot/pkg-a" at "1.0.1"
🦋  success packages published successfully:
🦋  @pixpilot/pkg-a@1.0.1
🦋  Creating git tag...
🦋  New tag:  @pixpilot/pkg-a@1.0.1
    `);

    mockGetPackages.mockResolvedValue({
      packages: [
        {
          dir: '/packages/pkg-a',
          packageJson: { name: '@pixpilot/pkg-a', version: '1.0.1', private: false },
        },
        {
          dir: '/packages/pkg-b',
          packageJson: { name: '@pixpilot/pkg-b', version: '2.0.0', private: false },
        },
      ],
    });

    const result = await publishPackages(branchConfig, npmToken);
    expect(result).toHaveLength(1);
    expect(result[0].packageJson.name).toBe('@pixpilot/pkg-a');
    expect(result[0].packageJson.version).toBe('1.0.1');
  });
  test('excludes private packages from released packages', async () => {
    const branchConfig = { name: 'main', isMatch: true };

    // Mock execSync to show a tag was created for a private package (shouldn't happen in reality)
    vi.mocked(execSync).mockReturnValue(`
🦋  Creating git tag...
🦋  New tag:  @private/pkg-a@1.0.0
    `);

    mockGetPackages.mockResolvedValue({
      packages: [
        {
          dir: '/packages/pkg-a',
          packageJson: { name: '@private/pkg-a', version: '1.0.0', private: true },
        },
        {
          dir: '/packages/pkg-b',
          packageJson: { name: 'pkg-b', version: '2.0.0', private: false },
        },
      ],
    });

    const result = await publishPackages(branchConfig, npmToken);
    expect(result).toHaveLength(0); // Private packages should be excluded
  });
  test('publishes without tag in prerelease mode even if channel is provided', async () => {
    const branchConfig = {
      name: 'next',
      isMatch: true,
      channel: 'next',
      prerelease: 'rc',
    };

    // Mock fs.existsSync to return true (in prerelease mode)
    vi.mocked(fs.existsSync).mockReturnValue(true);

    const result = await publishPackages(branchConfig, npmToken);

    expect(core.info).toHaveBeenCalledWith(
      'In prerelease mode - changeset will handle dist-tag automatically',
    );
    expect(core.info).toHaveBeenCalledWith(
      expect.stringContaining('npx changeset publish'),
    );
    expect(core.info).not.toHaveBeenCalledWith(
      expect.stringContaining('npx changeset publish --tag next'),
    );
    expect(execSync).toHaveBeenCalledWith(
      'npx changeset publish',
      expect.objectContaining({
        encoding: 'utf8',
        env: expect.objectContaining({ NODE_AUTH_TOKEN: npmToken }),
      }),
    );
    expect(Array.isArray(result)).toBe(true);
  });
});
