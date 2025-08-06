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
  groupBy?: 'prefix' | 'directory' | ((pkg: Package) => string);
}

/**
 * Groups packages by their name prefix (everything before the first slash after @scope/)
 * Example: @company/ui-button and @company/ui-input become "ui" group
 * Example: @company/api-auth and @company/api-users become "api" group
 */
function groupPackagesByPrefix(packages: Package[]): Record<string, Package[]> {
  const groups: Record<string, Package[]> = {};

  for (const pkg of packages) {
    let groupKey = 'misc';

    if (pkg.packageJson.name.startsWith('@')) {
      // Handle scoped packages: @scope/prefix-name -> prefix
      const parts = pkg.packageJson.name.split('/');
      if (parts.length > 1) {
        const nameAfterScope = parts[1];
        const prefixRegex = /^([a-zA-Z]+)/;
        const prefixMatch = prefixRegex.exec(nameAfterScope);
        if (prefixMatch) {
          groupKey = prefixMatch[1];
        }
      }
    } else {
      // Handle non-scoped packages: prefix-name -> prefix
      const prefixRegex = /^([a-zA-Z]+)/;
      const prefixMatch = prefixRegex.exec(pkg.packageJson.name);
      if (prefixMatch) {
        groupKey = prefixMatch[1];
      }
    }

    if (!(groupKey in groups)) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(pkg);
  }

  return groups;
}

/**
 * Groups packages by their directory structure
 * Example: packages/ui/button and packages/ui/input become "ui" group
 */
function groupPackagesByDirectory(packages: Package[]): Record<string, Package[]> {
  const groups: Record<string, Package[]> = {};

  for (const pkg of packages) {
    let groupKey = 'misc';

    // Extract directory name (assume packages are in packages/groupname/packagename structure)
    const pathParts = pkg.dir.split(/[/\\]/);
    const packagesIndex = pathParts.findIndex((part) => part === 'packages');

    if (packagesIndex !== -1 && packagesIndex + 1 < pathParts.length) {
      groupKey = pathParts[packagesIndex + 1];
    }

    if (!(groupKey in groups)) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(pkg);
  }

  return groups;
}

/**
 * Creates package groups based on the specified grouping strategy
 */
function createPackageGroups(
  packages: Package[],
  groupBy: 'prefix' | 'directory' | ((pkg: Package) => string),
): PackageGroup[] {
  let groups: Record<string, Package[]>;

  if (typeof groupBy === 'function') {
    groups = {};
    for (const pkg of packages) {
      const groupKey = groupBy(pkg);
      if (!(groupKey in groups)) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(pkg);
    }
  } else if (groupBy === 'directory') {
    groups = groupPackagesByDirectory(packages);
  } else {
    groups = groupPackagesByPrefix(packages);
  }

  return Object.entries(groups).map(([groupName, groupPackages]) => {
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
  repo,
  owner,
  repoName,
  groupReleases = false,
  groupBy = 'prefix',
}: CreateReleasesOptions): Promise<void> {
  core.info('Creating GitHub releases for published packages...');
  const octokit = new Octokit({ auth: githubToken });
  const [repoOwner, repoNameLocal] = repo.split('/');
  const finalOwner = owner ?? repoOwner;
  const finalRepoName = repoName ?? repoNameLocal;

  if (groupReleases) {
    // Create grouped releases
    core.info('Creating grouped releases...');
    const packageGroups = createPackageGroups(releasedPackages, groupBy);

    await Promise.all(
      packageGroups.map(async (group) => {
        try {
          await createGroupedRelease(octokit, group, finalOwner, finalRepoName);
          core.info(
            `Created grouped GitHub release for ${group.groupName} (${group.packages.length} packages)`,
          );
        } catch (error) {
          core.warning(
            `Failed to create grouped release for ${group.groupName}: ${String(error)}`,
          );
        }
      }),
    );
  } else {
    // Create individual releases (original behavior)
    await Promise.all(
      releasedPackages.map(async (pkg) => {
        const tagName = `${pkg.packageJson.name}@${pkg.packageJson.version}`;
        try {
          await createRelease(octokit, {
            pkg,
            tagName,
            owner: finalOwner,
            repo: finalRepoName,
          });
          core.info(`Created GitHub release for ${tagName}`);
        } catch (error) {
          core.warning(`Failed to create release for ${tagName}: ${String(error)}`);
        }
      }),
    );
  }
}
