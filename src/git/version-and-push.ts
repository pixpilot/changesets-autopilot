import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import * as core from '@actions/core';
import type { SimpleGit } from 'simple-git';

export async function gitVersionAndPush(git: SimpleGit, githubToken: string) {
  const cwd = process.cwd();

  // Debug: Check environment
  core.info(`=== DEBUG INFO ===`);
  core.info(`Working directory: ${cwd}`);
  core.info(`Node version: ${process.version}`);
  core.info(`PATH: ${process.env.PATH}`);

  // Debug: Check if .changeset exists
  const changesetDir = path.join(cwd, '.changeset');
  core.info(`Changeset dir exists: ${fs.existsSync(changesetDir)}`);

  if (fs.existsSync(changesetDir)) {
    const files = fs.readdirSync(changesetDir);
    core.info(`Changeset files: ${JSON.stringify(files)}`);

    // Check config.json
    const configPath = path.join(changesetDir, 'config.json');
    if (fs.existsSync(configPath)) {
      const config = fs.readFileSync(configPath, 'utf8');
      core.info(`Changeset config: ${config}`);
    } else {
      core.info('No config.json found in .changeset');
    }
  }

  // Debug: Check if npx/changeset is available
  try {
    const whichChangeset = execSync('which changeset', { encoding: 'utf8' });
    core.info(`Changeset binary location: ${whichChangeset.trim()}`);
  } catch {
    core.info('Changeset not in PATH, will use npx');
  }

  try {
    const npxVersion = execSync('npx --version', { encoding: 'utf8' });
    core.info(`NPX version: ${npxVersion.trim()}`);
  } catch (e) {
    core.info(`NPX check failed: ${String(e)}`);
  }

  // Debug: Try changeset status first
  try {
    core.info('=== CHECKING CHANGESET STATUS ===');
    const statusOutput = execSync('npx changeset status', {
      encoding: 'utf8',
      cwd: process.cwd(),
    });
    core.info(`Changeset status output: ${statusOutput}`);
  } catch (error) {
    core.info(`Changeset status failed: ${(error as Error).message}`);
    if (typeof error === 'object' && error !== null) {
      if (
        'stderr' in error &&
        typeof (error as { stderr?: Buffer }).stderr !== 'undefined'
      ) {
        core.info(`Status stderr: ${(error as { stderr?: Buffer }).stderr?.toString()}`);
      }
      if (
        'stdout' in error &&
        typeof (error as { stdout?: Buffer }).stdout !== 'undefined'
      ) {
        core.info(`Status stdout: ${(error as { stdout?: Buffer }).stdout?.toString()}`);
      }
    }
  }

  try {
    core.info('=== RUNNING CHANGESET VERSION ===');
    const versionOutput = execSync('npx changeset version', {
      encoding: 'utf8',
      cwd: process.cwd(),
      env: {
        ...process.env,
        GITHUB_TOKEN: githubToken, // Pass the GitHub token
      },
    });
    core.info(`Version output: ${versionOutput}`);
    core.info('Changeset version completed successfully');
  } catch (error) {
    core.info(`=== CHANGESET VERSION ERROR ===`);
    core.info(`Error message: ${(error as Error).message}`);
    if (typeof error === 'object' && error !== null) {
      if ('status' in error) {
        core.info(`Error code: ${(error as { status?: number }).status}`);
      }
      if ('signal' in error) {
        core.info(`Error signal: ${(error as { signal?: string }).signal}`);
      }
      if (
        'stdout' in error &&
        typeof (error as { stdout?: Buffer }).stdout !== 'undefined'
      ) {
        core.info(
          `Stdout: ${(error as { stdout?: Buffer }).stdout?.toString() ?? 'null'}`,
        );
      }
      if (
        'stderr' in error &&
        typeof (error as { stderr?: Buffer }).stderr !== 'undefined'
      ) {
        core.info(
          `Stderr: ${(error as { stderr?: Buffer }).stderr?.toString() ?? 'null'}`,
        );
      }
    }
    return; // Stop execution on any error
  }

  core.info('=== GIT OPERATIONS ===');
  await git.add('.');
  try {
    await git.commit('chore(release): version packages [skip ci]');
    core.info('Git commit successful');
  } catch (e) {
    core.info(`Git commit failed: ${String(e)}`);
  }

  const repo = process.env.GITHUB_REPOSITORY;
  const refName = process.env.GITHUB_REF_NAME;
  core.info(`Repo: ${repo}, Ref: ${refName}`);

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
