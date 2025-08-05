import path from 'path';

import * as core from '@actions/core';
import getReleasePlan from '@changesets/get-release-plan';
import type { NewChangeset } from '@changesets/types';
import { getPackages } from '@manypkg/get-packages';

import type { ChangesMap, PackageChange, Commit } from '../../types/changes';

export async function getChangesSinceLastCommit() {
  const { packages } = await getPackages(process.cwd());

  // Filter out private packages
  const publicPackages = packages.filter((pkg) => !pkg.packageJson.private);
  const privatePackages = packages.filter((pkg) => pkg.packageJson.private);
  if (privatePackages.length > 0) {
    core.info(
      'Skipped private packages: ' +
        privatePackages.map((pkg) => pkg.packageJson.name).join(', '),
    );
  }

  try {
    // Get the release plan from changesets
    // This automatically determines what needs to be released based on existing changesets
    const releasePlan = await getReleasePlan(process.cwd());

    core.info(`Found ${releasePlan.releases.length} packages to release`);
    core.info(`Found ${releasePlan.changesets.length} changesets`);

    // If no releases are planned, return empty
    if (releasePlan.releases.length === 0) {
      core.info('No releases planned by changesets');
      return {};
    }

    const changes: ChangesMap = {};

    // Process each release in the plan
    for (const release of releasePlan.releases) {
      // Skip packages with no version change
      if (release.type === 'none') {
        continue;
      }

      // Find the corresponding package
      const pkg = publicPackages.find((p) => p.packageJson.name === release.name);
      if (!pkg) {
        core.warning(`Package ${release.name} not found in workspace packages`);
        continue;
      }

      // Get changesets that affect this package
      const relevantChangesets = releasePlan.changesets.filter(
        (changeset: NewChangeset) =>
          changeset.releases.some((r) => r.name === release.name && r.type !== 'none'),
      );

      // Convert changesets to our Commit format for compatibility
      const commits: Commit[] = relevantChangesets.map((changeset: NewChangeset) => ({
        hash: changeset.id, // Use changeset ID as hash
        date: new Date().toISOString(), // We don't have commit dates from changesets
        message: changeset.summary,
        refs: '',
        body: changeset.summary,
        author_name: 'changeset',
        author_email: 'changeset@changesets.dev',
      }));

      // Since changesets don't track specific files, we'll include the package.json
      // This is sufficient for the changeset workflow
      const pkgPath = path.relative(process.cwd(), pkg.dir).replace(/\\/g, '/');
      const files = [`${pkgPath}/package.json`];

      changes[release.name] = {
        files,
        commits,
        version: release.oldVersion,
        private: pkg.packageJson.private ?? false,
      } as PackageChange;

      core.info(
        `Package ${release.name}: ${release.oldVersion} → ${release.newVersion} (${release.type})`,
      );
    }

    return changes;
  } catch (error) {
    core.error('Error getting release plan: ' + String(error));
    return {};
  }
}
