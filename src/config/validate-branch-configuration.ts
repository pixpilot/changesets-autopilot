import type { ResolvedBranchConfig } from './get-branch-config';

import { log } from '../utils/log';

/**
 * Validates branch configuration and logs appropriate messages
 */
export function validateBranchConfiguration(branchConfig: ResolvedBranchConfig): boolean {
  const prereleaseSuffix =
    typeof branchConfig.prerelease === 'string' && branchConfig.prerelease.length > 0
      ? ` (prerelease: ${branchConfig.prerelease})`
      : '';

  if (!branchConfig.isMatch) {
    log.info(
      `Current branch '${branchConfig.name}' is not configured for releases. Skipping.`,
    );
    return false;
  }
  log.info(`Processing release for branch '${branchConfig.name}'${prereleaseSuffix}`);
  return true;
}
