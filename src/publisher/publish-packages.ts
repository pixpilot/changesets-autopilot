import { execSync } from 'child_process';

import * as core from '@actions/core';

import type { ResolvedBranchConfig } from '../config/get-branch-config';

function ensureChangesetsAvailable(): void {
  try {
    // Try to run changeset to see if it's available
    execSync('npx changeset --version', {
      stdio: 'pipe', // Don't show output
      timeout: 10000,
    });
    core.info('Changesets CLI is available');
  } catch (_error) {
    core.info('Changesets CLI not found, installing globally as fallback...');
    execSync('npm install -g @changesets/cli', { stdio: 'inherit' });
  }
}

export function publishPackages(
  branchConfig: ResolvedBranchConfig,
  npmToken: string,
): void {
  // Ensure changesets is available
  ensureChangesetsAvailable();

  const publishCommand = branchConfig.channel
    ? `npx changeset publish --tag ${branchConfig.channel}`
    : 'npx changeset publish';

  core.info(`Publishing packages: ${publishCommand}`);
  execSync(publishCommand, {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: { ...process.env, NODE_AUTH_TOKEN: npmToken },
  });
}
