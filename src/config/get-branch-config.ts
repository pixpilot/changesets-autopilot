import type { BranchConfig } from '../../types';

export interface ResolvedBranchConfig {
  name: string;
  prerelease?: string;
  channel?: string;
  isMatch: boolean;
}

/**
 * Resolves the branch configuration for the current branch
 * @param branches - Array of branch configurations
 * @param currentBranch - Current branch name (defaults to GITHUB_REF_NAME env var)
 * @returns Resolved branch configuration
 */
export function getBranchConfig(
  branches: (string | BranchConfig)[],
  currentBranch?: string,
): ResolvedBranchConfig {
  const branch = currentBranch ?? process.env.GITHUB_REF_NAME ?? 'main';
  for (const branchConfig of branches) {
    if (typeof branchConfig === 'string') {
      if (branchConfig === branch) {
        return {
          name: branchConfig,
          isMatch: true,
        };
      }
    } else {
      if (branchConfig.name === branch) {
        return {
          name: branchConfig.name,
          prerelease: branchConfig.prerelease,
          channel: branchConfig.channel,
          isMatch: true,
        };
      }
    }
  }
  // Return default config for unmatched branches
  return {
    name: branch,
    isMatch: false,
  };
}
