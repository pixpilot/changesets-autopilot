import { execSync } from 'child_process';

import * as core from '@actions/core';

export function ensureChangesetsAvailable(): void {
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
