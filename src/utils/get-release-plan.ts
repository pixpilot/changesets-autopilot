import * as core from '@actions/core';
import getReleasePlan from '@changesets/get-release-plan';

export interface ReleasePackage {
  name: string;
  version: string;
  type: 'major' | 'minor' | 'patch' | 'none';
}

/**
 * Gets the packages that will be versioned by changeset based on current changesets
 */
export async function getPackagesToRelease(): Promise<ReleasePackage[]> {
  try {
    const cwd = process.cwd();
    const releasePlan = await getReleasePlan(cwd);

    const packagesToRelease: ReleasePackage[] = [];

    // Get packages that have version changes
    for (const release of releasePlan.releases) {
      if (release.type !== 'none') {
        packagesToRelease.push({
          name: release.name,
          version: release.newVersion,
          type: release.type,
        });
      }
    }

    core.info(`Found ${packagesToRelease.length} packages to be released:`);
    for (const pkg of packagesToRelease) {
      core.info(`  - ${pkg.name}@${pkg.version} (${pkg.type})`);
    }

    return packagesToRelease;
  } catch (error) {
    core.warning(`Failed to get release plan: ${String(error)}`);
    return [];
  }
}
