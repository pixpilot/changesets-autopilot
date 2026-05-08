import type { ReleasePackage } from './get-release-plan';

import { DEFAULT_RELEASE_COMMIT_MESSAGE } from '../constants/release-commit-message';
import { log } from './core';

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
      log.info(`Creating commit message for single package: ${pkg.name}@${pkg.version}`);
    } else if (packagesToRelease.length > 1) {
      // Multiple packages - add versions to commit body (only changed packages)
      const packageVersions = packagesToRelease
        .map((pkg) => `${pkg.name}@${pkg.version}`)
        .join('\n');

      commitMessage = `${DEFAULT_RELEASE_COMMIT_MESSAGE}\n\n${packageVersions}`;
      log.info(
        `Creating commit message for ${packagesToRelease.length} changed packages`,
      );
    } else {
      // No changed packages found - use default message
      log.info('No changed packages found, using default message');
    }
  } catch (error) {
    log.warning(`Failed to get package information for commit message: ${String(error)}`);
    // Fall back to default message
  }

  return commitMessage;
}
