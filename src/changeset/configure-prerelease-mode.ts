import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import * as core from '@actions/core';

import type { ResolvedBranchConfig } from '../config/get-branch-config';

import { changesetDir } from './changesets';

/**
 * Manages pre-release mode based on branch configuration
 */
export function configurePrereleaseMode(branchConfig: ResolvedBranchConfig): void {
  // Debug logging for environment and paths
  core.info(
    `DEBUG: configurePrereleaseMode - Current working directory : ${process.cwd()}`,
  );
  core.info(`DEBUG: configurePrereleaseMode - changesetDir: ${changesetDir}`);

  core.info(
    `DEBUG: configurePrereleaseMode called with branch config - name: ${branchConfig.name}, prerelease: ${branchConfig.prerelease}, channel: ${branchConfig.channel}, isMatch: ${branchConfig.isMatch}`,
  );

  const preJsonPath = path.join(changesetDir, 'pre.json');
  core.info(`DEBUG: Checking for pre.json at path: ${preJsonPath}`);

  const isInPrereleaseMode = fs.existsSync(preJsonPath);
  core.info(`DEBUG: Is in prerelease mode (before any changes): ${isInPrereleaseMode}`);

  if (branchConfig.prerelease) {
    core.info(`DEBUG: Branch config has prerelease: ${branchConfig.prerelease}`);
    if (!isInPrereleaseMode) {
      const prereleaseCommand = `npx changeset pre enter ${branchConfig.prerelease}`;
      core.info(`Entering pre-release mode: ${prereleaseCommand}`);
      core.info(`DEBUG: About to execute: ${prereleaseCommand}`);
      execSync(prereleaseCommand, { stdio: 'inherit' });
      core.info(`DEBUG: Finished executing pre enter command`);
    } else {
      core.info('Already in pre-release mode, skipping enter.');
    }
  } else {
    core.info(`DEBUG: Branch config has no prerelease setting`);
    if (isInPrereleaseMode) {
      core.info('Exiting pre-release mode');
      core.info(`DEBUG: About to execute: npx changeset pre exit`);
      execSync('npx changeset pre exit', { stdio: 'inherit' });
      core.info(`DEBUG: Finished executing pre exit command`);
    } else {
      core.info('Not in pre-release mode, skipping exit.');
    }
  }

  // Double-check the state after our operations
  const finalIsInPrereleaseMode = fs.existsSync(preJsonPath);
  core.info(`DEBUG: Final prerelease mode state: ${finalIsInPrereleaseMode}`);

  if (finalIsInPrereleaseMode) {
    try {
      const preJsonContent = fs.readFileSync(preJsonPath, 'utf8');
      core.info(`DEBUG: Final pre.json contents: ${preJsonContent}`);
    } catch (error) {
      core.info(`DEBUG: Error reading final pre.json: ${String(error)}`);
    }
  }
}
