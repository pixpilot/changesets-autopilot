import { execSync } from 'child_process';

import * as core from '@actions/core';
import { getPackages } from '@manypkg/get-packages';

import type { ResolvedBranchConfig } from '../config/get-branch-config';
import type { Package } from '../github/create-release';

export async function publishPackages(
  branchConfig: ResolvedBranchConfig,
  npmToken: string,
): Promise<Package[]> {
  // Get packages info before publishing
  const { packages: beforePackages } = await getPackages(process.cwd());
  const beforeVersions = new Map<string, string>();

  for (const pkg of beforePackages) {
    if (!pkg.packageJson.private) {
      beforeVersions.set(pkg.packageJson.name, pkg.packageJson.version);
    }
  }

  const publishCommand = branchConfig.channel
    ? `npx changeset publish --tag ${branchConfig.channel}`
    : 'npx changeset publish';

  core.info(`Publishing packages: ${publishCommand}`);
  execSync(publishCommand, {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: { ...process.env, NODE_AUTH_TOKEN: npmToken },
  });

  // Get packages info after publishing to detect which were released
  const { packages: afterPackages } = await getPackages(process.cwd());
  const releasedPackages: Package[] = [];

  for (const pkg of afterPackages) {
    if (!pkg.packageJson.private) {
      const beforeVersion = beforeVersions.get(pkg.packageJson.name);
      // If version changed or package is new, it was published
      if (!beforeVersion || beforeVersion !== pkg.packageJson.version) {
        releasedPackages.push({
          dir: pkg.dir,
          packageJson: {
            name: pkg.packageJson.name,
            version: pkg.packageJson.version,
            private: pkg.packageJson.private,
          },
        });
        core.info(
          `Package ${pkg.packageJson.name} was published with version ${pkg.packageJson.version}`,
        );
      }
    }
  }

  return releasedPackages;
}
