import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import * as core from '@actions/core';
import { getPackages } from '@manypkg/get-packages';

import { changesetDir } from '../changeset/changesets';
import type { ResolvedBranchConfig } from '../config/get-branch-config';
import type { Package } from '../github/create-release';
import { parsePublishedPackageNames } from '../utils/parse-published-packages';

function getPublishErrorDetails(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export async function publishPackages(
  branchConfig: ResolvedBranchConfig,
  npmToken?: string,
  provenance = false,
): Promise<Package[]> {
  const preJsonPath = path.join(changesetDir, 'pre.json');
  const isInPrereleaseMode = fs.existsSync(preJsonPath);
  const isTokenMode = Boolean(npmToken);

  const publishCommand =
    !isInPrereleaseMode && branchConfig.channel
      ? `npx changeset publish --tag ${branchConfig.channel}`
      : 'npx changeset publish';

  if (isInPrereleaseMode) {
    core.info('In prerelease mode - changeset will handle dist-tag automatically');
  } else if (branchConfig.channel) {
    core.info(`Using custom dist-tag: ${branchConfig.channel}`);
  }

  core.info(`Auth mode: ${npmToken ? 'token' : 'OIDC'}`);
  core.info(`Provenance: ${provenance ? 'enabled' : 'disabled'}`);

  core.info(`Publishing packages...`);

  const publishEnv: NodeJS.ProcessEnv = { ...process.env };
  if (isTokenMode) {
    publishEnv.NODE_AUTH_TOKEN = npmToken;
  }

  if (provenance) {
    publishEnv.NPM_CONFIG_PROVENANCE = 'true';
  }

  let publishOutput = '';
  try {
    publishOutput = execSync(publishCommand, {
      encoding: 'utf8',
      cwd: process.cwd(),
      env: publishEnv,
    });
  } catch (error) {
    const details = getPublishErrorDetails(error);
    if (isTokenMode) {
      throw new Error(
        `Publishing failed in token mode. Verify NPM_TOKEN has publish access. Details: ${details}`,
      );
    }

    throw new Error(
      `Publishing failed in OIDC trusted publisher mode. Ensure workflow has permissions.id-token: write and npm trusted publisher is configured for this repository. Details: ${details}`,
    );
  }

  core.info(publishOutput);

  const publishedPackageNames = parsePublishedPackageNames(publishOutput);
  for (const pkgName of publishedPackageNames) {
    core.info(`Detected published package from tag: ${pkgName}`);
  }

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
