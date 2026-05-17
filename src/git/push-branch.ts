import type { SimpleGit } from 'simple-git';
import process from 'node:process';
import { log } from '../utils/log';

export async function pushBranch(git: SimpleGit, githubToken: string): Promise<void> {
  const repo = process.env.GITHUB_REPOSITORY;
  const refName = process.env.GITHUB_REF_NAME;
  const hasRepo = typeof repo === 'string' && repo.length > 0;
  const hasToken = githubToken.length > 0;
  const hasRefName = typeof refName === 'string' && refName.length > 0;

  if (!hasRepo || !hasToken || !hasRefName) {
    throw new Error('Missing repo, token, or refName for push.');
  }

  try {
    // Get current branch name to ensure we push to the correct branch
    const currentBranch = await git.branch(['--show-current']);
    const branchName = currentBranch.current || refName;

    log.info(`Pushing to branch: ${branchName} (GITHUB_REF_NAME: ${refName})`);

    // Push the current branch to the remote branch with the same name
    await git.push(`https://${githubToken}@github.com/${repo}.git`, `HEAD:${branchName}`);
    log.info('Git push successful');
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    throw new Error(`Git push failed: ${errorMessage}`);
  }
}
