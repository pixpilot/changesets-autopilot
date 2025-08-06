import * as core from '@actions/core';
import { Octokit } from '@octokit/rest';

import { createRelease } from './create-release';
import type { Package } from './create-release';

export interface PackageGroup {
  groupName: string;
  packages: Package[];
  tagName: string;
  version: string;
}

export interface CreateReleasesOptions {
  releasedPackages: Package[];
  githubToken: string;
  repo: string;
  owner?: string;
  repoName?: string;
  groupReleases?: boolean;
  packageGroups?: Record<string, string[]>; // groupName -> array of package names
}

/**
 * Creates package groups based on the provided package groups configuration
 */
function createPackageGroups(
  packages: Package[],
  packageGroups: Record<string, string[]>,
): PackageGroup[] {
  const groups: Record<string, Package[]> = {};

  // Initialize groups
  for (const [groupName] of Object.entries(packageGroups)) {
    groups[groupName] = [];
  }

  // Add ungrouped packages to a default group
  groups.misc = [];

  // Assign packages to their groups
  for (const pkg of packages) {
    let assigned = false;

    for (const [groupName, packageNames] of Object.entries(packageGroups)) {
      if (packageNames.includes(pkg.packageJson.name)) {
        groups[groupName].push(pkg);
        assigned = true;
        break;
      }
    }

    // If package wasn't found in any group, add to misc
    if (!assigned) {
      groups.misc.push(pkg);
    }
  }

  // Remove empty groups
  const filteredGroups = Object.entries(groups).filter(([_, pkgs]) => pkgs.length > 0);

  return filteredGroups.map(([groupName, groupPackages]) => {
    // Sort packages by version to get the highest version for the group
    const sortedPackages = groupPackages.sort((a, b) =>
      b.packageJson.version.localeCompare(a.packageJson.version, undefined, {
        numeric: true,
      }),
    );

    const highestVersion = sortedPackages[0].packageJson.version;
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    return {
      groupName,
      packages: groupPackages,
      tagName: `${groupName}@${highestVersion}`,
      version: `${groupName} v${highestVersion} (${date})`,
    };
  });
}

/**
 * Creates a grouped release for multiple packages
 */
async function createGroupedRelease(
  octokit: Octokit,
  group: PackageGroup,
  owner: string,
  repo: string,
): Promise<void> {
  const releaseTitle = `${group.groupName} Release v${group.packages[0].packageJson.version}`;
  const currentDate = new Date().toISOString().split('T')[0];

  // Create release body with all packages in the group
  const packageList = group.packages
    .map((pkg) => `- **${pkg.packageJson.name}@${pkg.packageJson.version}**`)
    .join('\n');

  const releaseBody = `## ${group.groupName} Release (${currentDate})

### Packages Updated

${packageList}

---

This is a grouped release for ${group.groupName} packages.`;

  // Use the highest version package's tag as the base tag for the group
  const basePackage = group.packages.reduce((prev, current) =>
    prev.packageJson.version > current.packageJson.version ? prev : current,
  );
  const baseTag = `${basePackage.packageJson.name}@${basePackage.packageJson.version}`;

  await octokit.repos.createRelease({
    owner,
    repo,
    name: releaseTitle,
    tag_name: baseTag, // Use existing package tag instead of custom group tag
    body: releaseBody,
    prerelease: group.packages.some((pkg) => pkg.packageJson.version.includes('-')),
  });
}

export async function createReleasesForPackages({
  releasedPackages,
  githubToken,
  repo: _repo,
  owner,
  repoName,
  groupReleases = false,
  packageGroups,
}: CreateReleasesOptions): Promise<void> {
  if (releasedPackages.length === 0) {
    return;
  }

  const octokit = new Octokit({ auth: githubToken });

  if (groupReleases && packageGroups) {
    core.info('Creating GitHub grouped releases for published packages...');
    const groupedPackages = createPackageGroups(releasedPackages, packageGroups);

    for (const group of groupedPackages) {
      try {
        await createGroupedRelease(octokit, group, owner ?? '', repoName ?? '');
        core.info(
          `Created GitHub grouped release for ${group.groupName} (${group.packages.length} packages)`,
        );
      } catch (error) {
        core.warning(
          `Failed to create grouped release for ${group.groupName}: ${String(error)}`,
        );
      }
    }
  } else {
    core.info('Creating GitHub releases for published packages...');

    for (const pkg of releasedPackages) {
      try {
        await createRelease(octokit, {
          pkg,
          tagName: `${pkg.packageJson.name}@${pkg.packageJson.version}`,
          owner: owner ?? '',
          repo: repoName ?? '',
        });
        core.info(
          `Created GitHub release for ${pkg.packageJson.name}@${pkg.packageJson.version}`,
        );
      } catch (error) {
        core.warning(
          `Failed to create release for ${pkg.packageJson.name}@${pkg.packageJson.version}: ${String(error)}`,
        );
      }
    }
  }
}
