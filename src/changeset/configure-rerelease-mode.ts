import type { ResolvedBranchConfig } from '../config/get-branch-config';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import * as core from '@actions/core';

import { changesetDir } from './changesets';

/**
 * Manages pre-release mode based on branch configuration
 */
export function configureRereleaseMode(branchConfig: ResolvedBranchConfig): void {
  const preJsonPath = path.join(changesetDir, 'pre.json');
  const isInPrereleaseMode = fs.existsSync(preJsonPath);
  const hasPrereleaseLabel =
    typeof branchConfig.prerelease === 'string' && branchConfig.prerelease.length > 0;

  if (hasPrereleaseLabel) {
    if (!isInPrereleaseMode) {
      const prereleaseCommand = `npx changeset pre enter ${branchConfig.prerelease}`;
      core.info(`Entering pre-release mode: ${prereleaseCommand}`);
      execSync(prereleaseCommand, { stdio: 'inherit' });
    } else {
      core.info('Already in pre-release mode, skipping enter.');
    }
  } else if (isInPrereleaseMode) {
    core.info('Exiting pre-release mode');
    execSync('npx changeset pre exit', { stdio: 'inherit' });
  } else {
    core.info('Not in pre-release mode, skipping exit.');
  }
}
