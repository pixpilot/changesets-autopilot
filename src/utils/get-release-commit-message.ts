import * as core from '@actions/core';

import { DEFAULT_RELEASE_COMMIT_MESSAGE } from '../constants/release-commit-message';

import type { ReleasePackage } from './get-release-plan';

/**
 * Generates a release commit message based on the packages to release.
 * Returns the commit message string.
 */
export function getReleaseCommitMessage(packagesToRelease: ReleasePackage[]): string {
  let commitMessage = DEFAULT_RELEASE_COMMIT_MESSAGE;

  try {
    if (packagesToRelease.length === 1) {
      // Single package - include version in title
      const pkg = packagesToRelease[0];
      commitMessage = `chore(release): ${pkg.version} [skip ci]`;
      core.info(`Creating commit message for single package: ${pkg.name}@${pkg.version}`);
    } else if (packagesToRelease.length > 1) {
      // Multiple packages - add versions to commit body (only changed packages)
      const packageVersions = packagesToRelease
        .map((pkg) => `${pkg.name}@${pkg.version}`)
        .join('\n');

      commitMessage = `${DEFAULT_RELEASE_COMMIT_MESSAGE}\n\n${packageVersions}`;
      core.info(
        `Creating commit message for ${packagesToRelease.length} changed packages`,
      );
    } else {
      // No changed packages found - use default message
      core.info('No changed packages found, using default commit message');
    }
  } catch (error) {
    core.warning(
      `Failed to get package information for commit message: ${String(error)}`,
    );
    // Fall back to default message
  }

  return commitMessage;
}
