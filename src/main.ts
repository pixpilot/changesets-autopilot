import process from 'process';
import { fileURLToPath } from 'url';

import * as core from '@actions/core';

import { configurePrereleaseMode, ensureChangesets } from './changeset';
import { getActionInputs, getBranchConfig, validateBranchConfiguration } from './config';
import { configureGit, gitVersionAndPush } from './git';
import { publishPackages } from './publisher';

/**
 * The main function for the action.
 */
export async function run(): Promise<void> {
  try {
    // Initialize inputs and configuration
    const { githubToken, npmToken, botName, branches } = getActionInputs();
    const branchConfig = getBranchConfig(branches);

    // Validate branch configuration
    if (!validateBranchConfiguration(branchConfig)) {
      return;
    }

    // Configure Git user
    const git = await configureGit(botName);

    // Ensure we have changesets to work with
    const hasChangesetFiles = await ensureChangesets();

    // Manage pre-release mode based on branch configuration
    configurePrereleaseMode(branchConfig);

    // Version and push changes if we have changesets
    if (hasChangesetFiles) {
      core.info('Processing versioning and git operations...');
      await gitVersionAndPush(git, githubToken);

      // Publish to npm if token is provided
      if (npmToken) {
        publishPackages(branchConfig, npmToken);
        core.info('Packages published successfully!');
      } else {
        core.info('No npm token provided, skipping publish step.');
      }
    } else {
      core.info('No changesets to process. Action completed.');
    }

    core.info('Changeset autopilot completed successfully!');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    core.setFailed(`Action failed: ${errorMessage}`);
  }
}

// Execute if this file is run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  void run();
}
