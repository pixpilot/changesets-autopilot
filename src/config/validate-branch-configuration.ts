import * as core from '@actions/core';

import type { ResolvedBranchConfig } from './get-branch-config';

/**
 * Validates branch configuration and logs appropriate messages
 */
export function validateBranchConfiguration(branchConfig: ResolvedBranchConfig): boolean {
  if (!branchConfig.isMatch) {
    core.info(
      `Current branch '${branchConfig.name}' is not configured for releases. Skipping.`,
    );
    return false;
  }
  core.info(
    `Processing release for branch '${branchConfig.name}'${
      branchConfig.prerelease ? ` (prerelease: ${branchConfig.prerelease})` : ''
    }`,
  );
  return true;
}
