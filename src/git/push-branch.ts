import * as core from '@actions/core';
import type { SimpleGit } from 'simple-git';

export async function pushBranch(git: SimpleGit, githubToken: string) {
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
}
