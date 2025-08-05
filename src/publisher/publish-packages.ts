import { execSync } from 'child_process';

import * as core from '@actions/core';
import { getPackages } from '@manypkg/get-packages';

import type { ResolvedBranchConfig } from '../config/get-branch-config';
import type { Package } from '../github/create-release';

export async function publishPackages(
  branchConfig: ResolvedBranchConfig,
  npmToken: string,
): Promise<Package[]> {
  const publishCommand = branchConfig.channel
    ? `npx changeset publish --tag ${branchConfig.channel}`
    : 'npx changeset publish';

  core.info(`Publishing packages: ${publishCommand}`);

  // Capture the output from changeset publish to detect which packages were published
  const publishOutput = execSync(publishCommand, {
    encoding: 'utf8',
    cwd: process.cwd(),
    env: { ...process.env, NODE_AUTH_TOKEN: npmToken },
  });

  core.info(publishOutput); // Display the full output in the logs

  // Parse the output to find published packages using the "New tag:" approach
  const publishedPackageNames = new Set<string>();
  const lines = publishOutput.split('\n');

  // Look for "New tag:" lines which indicate a package was published
  const newTagRegex = /New tag:\s+(@[^/]+\/[^@]+|[^/]+)@([^\s]+)/;

  for (const line of lines) {
    const match = newTagRegex.exec(line);
    if (match) {
      const pkgName = match[1];
      publishedPackageNames.add(pkgName);
      core.info(`Detected published package from tag: ${pkgName}`);
    }
  }

  // Get current packages info and filter to only published ones
  const { packages } = await getPackages(process.cwd());
  const releasedPackages: Package[] = [];

  for (const pkg of packages) {
    if (!pkg.packageJson.private && publishedPackageNames.has(pkg.packageJson.name)) {
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

  return releasedPackages;
}
