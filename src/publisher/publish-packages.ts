import { execSync } from 'child_process';

import * as core from '@actions/core';

import type { ResolvedBranchConfig } from '../config/get-branch-config';

/**
 * Handles package publishing with appropriate npm tags
 */
export function publishPackages(
  branchConfig: ResolvedBranchConfig,
  npmToken: string,
): void {
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
