import * as core from '@actions/core';
import applyReleasePlan from '@changesets/apply-release-plan';
import assembleReleasePlan from '@changesets/assemble-release-plan';
import { read } from '@changesets/config';
import readChangesets from '@changesets/read';
import { getPackages } from '@manypkg/get-packages';
import type { SimpleGit } from 'simple-git';

/**
 * Versions packages, commits, and pushes changes to the repository.
 * @param {string} githubToken - GitHub token for authentication
 */
export async function gitVersionAndPush(git: SimpleGit, githubToken: string) {
  process.env.PRETTIER_FALLBACK_RESOLVE = 'true';

  // Gather changeset objects from .changeset markdown files
  const cwd = process.cwd();

  core.info('Reading packages...');
  const packages = await getPackages(cwd);

  core.info('Reading changesets config...');
  // The config is needed to know how to generate changelogs
  const config = await read(cwd, packages as never);

  core.info('Reading changeset files...');
  const changesets = await readChangesets(cwd);

  if (changesets.length === 0) {
    core.info('No changesets found. Skipping versioning.');
    return;
  }

  core.info('Assembling release plan...');
  const releasePlan = assembleReleasePlan(
    changesets,
    packages as never,
    config,
    undefined, // previous versions data - not needed for basic versioning
    undefined, // options
  );

  core.info('Applying release plan...');
  await applyReleasePlan(
    releasePlan,
    packages as never,
    config,
    undefined, // snapshot info
  );

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
