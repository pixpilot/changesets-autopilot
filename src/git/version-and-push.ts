import { execSync } from 'child_process';

import * as core from '@actions/core';
import type { SimpleGit } from 'simple-git';

import { DEFAULT_RELEASE_COMMIT_MESSAGE } from '../constants/release-commit-message';
import { getPackagesToRelease } from '../utils/get-release-plan';

export async function gitVersionAndPush(git: SimpleGit, githubToken: string) {
  let packagesToRelease: Awaited<ReturnType<typeof getPackagesToRelease>> = [];

  try {
    // Get packages that will be released BEFORE running changeset version
    // because changeset version consumes the changeset files
    packagesToRelease = await getPackagesToRelease();

    core.info(
      `Found "${packagesToRelease.map((x) => x.name).join(',')}" packages to be released`,
    );
  } catch (error) {
    core.warning(`Failed to get release plan: ${String(error)}`);
    // Continue with empty array - will use default commit message
  }

  try {
    core.info('Running changeset version command...');
    const versionOutput = execSync('npx changeset version', {
      encoding: 'utf8',
      cwd: process.cwd(),
      env: {
        ...process.env,
        GITHUB_TOKEN: githubToken,
      },
    });
    core.info(versionOutput);
    core.info('Changeset version completed successfully');
  } catch (error) {
    core.info(`Error message: ${(error as Error).message}`);
    return;
  }

  // Get packages information after versioning to create an appropriate commit message
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

  await git.add('.');
  try {
    await git.commit(commitMessage);
    core.info('Git commit successful');
  } catch (e) {
    core.info(`Git commit failed: ${String(e)}`);
  }

  const repo = process.env.GITHUB_REPOSITORY;
  const refName = process.env.GITHUB_REF_NAME;
  if (repo && githubToken && refName) {
    try {
      // Push the branch
      await git.push(`https://${githubToken}@github.com/${repo}.git`, `HEAD:${refName}`);
      core.info('Git push successful');
    } catch (e) {
      core.info(`Git push failed: ${String(e)}`);
    }
  } else {
    core.info('Missing repo, token, or refName for push.');
  }
}
