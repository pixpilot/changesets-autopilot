import * as core from '@actions/core';
import { describe, expect, it, vi } from 'vitest';

import { validateBranchConfiguration } from '../../src/config/validate-branch-configuration';

vi.mock('@actions/core', () => ({
  info: vi.fn(),
}));

describe('validateBranchConfiguration', () => {
  it('should be a function', () => {
    expect(typeof validateBranchConfiguration).toBe('function');
  });

  it('should return false and log when branch is not configured for releases', () => {
    const branchConfig = { isMatch: false, name: 'feature/test' };
    const result = validateBranchConfiguration(branchConfig);
    expect(result).toBe(false);
    expect(core.info).toHaveBeenCalledWith(
      "Current branch 'feature/test' is not configured for releases. Skipping.",
    );
  });

  it('should return true and log when branch is configured for releases (no prerelease)', () => {
    const branchConfig = { isMatch: true, name: 'main' };
    const result = validateBranchConfiguration(branchConfig);
    expect(result).toBe(true);
    expect(core.info).toHaveBeenCalledWith("Processing release for branch 'main'");
  });

  it('should return true and log when branch is configured for releases (with prerelease)', () => {
    const branchConfig = { isMatch: true, name: 'develop', prerelease: 'beta' };
    const result = validateBranchConfiguration(branchConfig);
    expect(result).toBe(true);
    expect(core.info).toHaveBeenCalledWith(
      "Processing release for branch 'develop' (prerelease: beta)",
    );
  });
});
