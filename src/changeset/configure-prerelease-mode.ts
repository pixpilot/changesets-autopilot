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
  const preJsonPath = path.join(changesetDir, 'pre.json');
  const isInPrereleaseMode = fs.existsSync(preJsonPath);

  if (branchConfig.prerelease) {
    if (!isInPrereleaseMode) {
      const prereleaseCommand = `pnpm changeset pre enter ${branchConfig.prerelease}`;
      core.info(`Entering pre-release mode: ${prereleaseCommand}`);
      execSync(prereleaseCommand, { stdio: 'inherit' });
    } else {
      core.info('Already in pre-release mode, skipping enter.');
    }
  } else {
    if (isInPrereleaseMode) {
      core.info('Exiting pre-release mode');
      execSync('pnpm changeset pre exit', { stdio: 'inherit' });
    } else {
      core.info('Not in pre-release mode, skipping exit.');
    }
  }
}
