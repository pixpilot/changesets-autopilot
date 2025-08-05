import { execSync } from 'child_process';

import * as core from '@actions/core';
import { getPackages } from '@manypkg/get-packages';
import type { SimpleGit } from 'simple-git';

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
  let commitMessage = 'chore(release): version packages [skip ci]';

  try {
    const { packages } = await getPackages(process.cwd());
    const nonPrivatePackages = packages.filter((pkg) => !pkg.packageJson.private);

    if (nonPrivatePackages.length === 1) {
      // Single package - include version in title
      const pkg = nonPrivatePackages[0];
      commitMessage = `chore(release): ${pkg.packageJson.version} [skip ci]`;
      core.info(
        `Creating commit message for single package: ${pkg.packageJson.name}@${pkg.packageJson.version}`,
      );
    } else if (nonPrivatePackages.length > 1) {
      // Multiple packages - add versions to commit body
      const packageVersions = nonPrivatePackages
        .map((pkg) => `${pkg.packageJson.name}: ${pkg.packageJson.version}`)
        .join('\n');

      commitMessage = `chore(release): version packages [skip ci]\n\n${packageVersions}`;
      core.info(`Creating commit message for ${nonPrivatePackages.length} packages`);
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
