import type { BranchConfig } from '../../types';

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getBranchConfig } from '../../src/config';

vi.mock('@actions/core');

describe('getBranchConfig', () => {
  const mockBranches: (string | BranchConfig)[] = [
    'main',
    {
      name: 'next',
      prerelease: 'rc',
      channel: 'next',
    },
    {
      name: 'beta',
      prerelease: 'beta',
      channel: 'beta',
    },
  ];

  beforeEach(() => {
    delete process.env.GITHUB_REF_NAME;
  });

  it('should match a simple string branch configuration', () => {
    const config = getBranchConfig(mockBranches, 'main');

    expect(config).toStrictEqual({
      name: 'main',
      isMatch: true,
    });
  });

  it('should match a complex branch configuration', () => {
    const config = getBranchConfig(mockBranches, 'next');

    expect(config).toStrictEqual({
      name: 'next',
      prerelease: 'rc',
      channel: 'next',
      isMatch: true,
    });
  });

  it('should return no match for unconfigured branch', () => {
    const config = getBranchConfig(mockBranches, 'feature/test');

    expect(config).toStrictEqual({
      name: 'feature/test',
      isMatch: false,
    });
  });

  it('should use GITHUB_REF_NAME environment variable when no current branch is provided', () => {
    process.env.GITHUB_REF_NAME = 'beta';
    const config = getBranchConfig(mockBranches);

    expect(config).toStrictEqual({
      name: 'beta',
      prerelease: 'beta',
      channel: 'beta',
      isMatch: true,
    });
  });

  it('should default to main when no branch is provided and GITHUB_REF_NAME is not set', () => {
    const config = getBranchConfig(mockBranches);

    expect(config).toStrictEqual({
      name: 'main',
      isMatch: true,
    });
  });
});
