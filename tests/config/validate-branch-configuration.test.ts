import * as core from '@actions/core';
import { describe, test, expect, vi } from 'vitest';

import { validateBranchConfiguration } from '../../src/config/validate-branch-configuration';

describe('validateBranchConfiguration', () => {
  test('should be a function', () => {
    expect(typeof validateBranchConfiguration).toBe('function');
  });

  test('should return false and log when branch is not configured for releases', () => {
    const mockInfo = vi.fn();
    // @ts-ignore
    core.info = mockInfo;
    const branchConfig = { isMatch: false, name: 'feature/test' };
    const result = validateBranchConfiguration(branchConfig);
    expect(result).toBe(false);
    expect(mockInfo).toHaveBeenCalledWith(
      "Current branch 'feature/test' is not configured for releases. Skipping.",
    );
  });

  test('should return true and log when branch is configured for releases (no prerelease)', () => {
    const mockInfo = vi.fn();
    // @ts-ignore
    core.info = mockInfo;
    const branchConfig = { isMatch: true, name: 'main' };
    const result = validateBranchConfiguration(branchConfig);
    expect(result).toBe(true);
    expect(mockInfo).toHaveBeenCalledWith("Processing release for branch 'main'");
  });

  test('should return true and log when branch is configured for releases (with prerelease)', () => {
    const mockInfo = vi.fn();
    // @ts-ignore
    core.info = mockInfo;
    const branchConfig = { isMatch: true, name: 'develop', prerelease: 'beta' };
    const result = validateBranchConfiguration(branchConfig);
    expect(result).toBe(true);
    expect(mockInfo).toHaveBeenCalledWith(
      "Processing release for branch 'develop' (prerelease: beta)",
    );
  });
});
