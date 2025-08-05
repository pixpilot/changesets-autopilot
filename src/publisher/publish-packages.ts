import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import * as core from '@actions/core';
import { getPackages } from '@manypkg/get-packages';

import { changesetDir } from '../changeset/changesets';
import type { ResolvedBranchConfig } from '../config/get-branch-config';
import type { Package } from '../github/create-release';
import { parsePublishedPackageNames } from '../utils/parse-published-packages';

export async function publishPackages(
  branchConfig: ResolvedBranchConfig,
  npmToken: string,
): Promise<Package[]> {
  // Check if we're in prerelease mode
  const preJsonPath = path.join(changesetDir, 'pre.json');
  const isInPrereleaseMode = fs.existsSync(preJsonPath);

  // In prerelease mode, changeset handles the tag automatically, so we shouldn't use --tag
  // In normal mode with a channel, we use --tag to specify the dist-tag
  const publishCommand =
    !isInPrereleaseMode && branchConfig.channel
      ? `npx changeset publish --tag ${branchConfig.channel}`
      : 'npx changeset publish';

  if (isInPrereleaseMode) {
    core.info('In prerelease mode - changeset will handle dist-tag automatically');
  } else if (branchConfig.channel) {
    core.info(`Using custom dist-tag: ${branchConfig.channel}`);
  }

  core.info(`Publishing packages: ${publishCommand}`);

  // Capture the output from changeset publish to detect which packages were published
  const publishOutput = execSync(publishCommand, {
    encoding: 'utf8',
    cwd: process.cwd(),
    env: { ...process.env, NODE_AUTH_TOKEN: npmToken },
  });

  core.info(publishOutput); // Display the full output in the logs

  // Use utility to parse published package names
  const publishedPackageNames = parsePublishedPackageNames(publishOutput);
  for (const pkgName of publishedPackageNames) {
    core.info(`Detected published package from tag: ${pkgName}`);
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
