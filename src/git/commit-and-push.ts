import * as core from '@actions/core';
import type { SimpleGit } from 'simple-git';

import { getReleaseCommitMessage } from '../utils/get-release-commit-message';
import { getPackagesToRelease } from '../utils/get-release-plan';

export async function commitAndPush(git: SimpleGit, githubToken: string) {
  let packagesToRelease: Awaited<ReturnType<typeof getPackagesToRelease>> = [];

  try {
    // Get packages that will be released BEFORE running changeset version
    // because changeset version consumes the changeset files
    packagesToRelease = await getPackagesToRelease();
  } catch (error) {
    core.warning(`Failed to get release plan: ${String(error)}`);
    // Continue with empty array - will use default commit message
  }

  // Use utility to get commit message
  const commitMessage = getReleaseCommitMessage(packagesToRelease);

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
      // Get current branch name to ensure we push to the correct branch
      const currentBranch = await git.branch(['--show-current']);
      const branchName = currentBranch.current || refName;

      core.info(`Pushing to branch: ${branchName} (GITHUB_REF_NAME: ${refName})`);

      // Push the current branch to the remote branch with the same name
      await git.push(
        `https://${githubToken}@github.com/${repo}.git`,
        `HEAD:${branchName}`,
      );
      core.info('Git push successful');
    } catch (e) {
      core.info(`Git push failed: ${String(e)}`);
    }
  } else {
    core.info('Missing repo, token, or refName for push.');
  }

  return commitMessage;
}
