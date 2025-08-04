import * as core from '@actions/core';
import type { SimpleGit } from 'simple-git';

import { runChangesetCommand } from '../changeset/changeset-command';

/**
 * Versions packages, commits, and pushes changes to the repository.
 * @param {string} githubToken - GitHub token for authentication
 */
export async function gitVersionAndPush(git: SimpleGit, githubToken: string) {
  core.info('Running changeset version...');
  runChangesetCommand('version', githubToken);

  await git.add('.');
  try {
    await git.commit('chore(release): version packages [skip ci]');
  } catch (e) {
    core.info(`No changes to commit or commit failed: ${String(e)}`);
  }
  const repo = process.env.GITHUB_REPOSITORY;
  const refName = process.env.GITHUB_REF_NAME;
  if (repo && githubToken && refName) {
    await git.push(`https://${githubToken}@github.com/${repo}.git`, `HEAD:${refName}`);
  } else {
    core.info('Missing repo, token, or refName for push.');
  }
}
