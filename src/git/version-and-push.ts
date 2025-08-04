import { execSync } from 'child_process';

import * as core from '@actions/core';
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
    core.info(`Version output: ${versionOutput}`);
    core.info('Changeset version completed successfully');
  } catch (error) {
    core.info(`Error message: ${(error as Error).message}`);

    return;
  }

  await git.add('.');
  try {
    await git.commit('chore(release): version packages [skip ci]');
    core.info('Git commit successful');
  } catch (e) {
    core.info(`Git commit failed: ${String(e)}`);
  }

  const repo = process.env.GITHUB_REPOSITORY;
  const refName = process.env.GITHUB_REF_NAME;
  if (repo && githubToken && refName) {
    try {
      await git.push(`https://${githubToken}@github.com/${repo}.git`, `HEAD:${refName}`);
      core.info('Git push successful');
    } catch (e) {
      core.info(`Git push failed: ${String(e)}`);
    }
  } else {
    core.info('Missing repo, token, or refName for push.');
  }
}
