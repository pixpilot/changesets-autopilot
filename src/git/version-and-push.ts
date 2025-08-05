import { execSync } from 'child_process';

import * as core from '@actions/core';
import type { SimpleGit } from 'simple-git';

import { DEFAULT_RELEASE_COMMIT_MESSAGE } from '../constants/release-commit-message';
import { getSelectedPackagesInfo } from '../utils/select-packages-info';

import { getChangesSinceLastCommit } from './get-changes';

export async function gitVersionAndPush(git: SimpleGit, githubToken: string) {
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
    const { publishablePackages } = await getSelectedPackagesInfo();

    // Get the packages that actually have changes (not just all publishable packages)
    const changedPackages = await getChangesSinceLastCommit();
    const changedPackageNames = Object.keys(changedPackages);

    // Filter publishable packages to only include those that have changes
    const changedPublishablePackages = publishablePackages.filter((pkg) =>
      changedPackageNames.includes(pkg.packageJson.name),
    );

    if (changedPublishablePackages.length === 1) {
      // Single package - include version in title
      const pkg = changedPublishablePackages[0];
      commitMessage = `chore(release): ${pkg.packageJson.version} [skip ci]`;
      core.info(
        `Creating commit message for single package: ${pkg.packageJson.name}@${pkg.packageJson.version}`,
      );
    } else if (changedPublishablePackages.length > 1) {
      // Multiple packages - add versions to commit body (only changed packages)
      const packageVersions = changedPublishablePackages
        .map((pkg) => `${pkg.packageJson.name}@${pkg.packageJson.version}`)
        .join('\n');

      commitMessage = `${DEFAULT_RELEASE_COMMIT_MESSAGE}\n\n${packageVersions}`;
      core.info(
        `Creating commit message for ${changedPublishablePackages.length} changed packages`,
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
