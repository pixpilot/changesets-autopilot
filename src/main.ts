import * as core from '@actions/core';

import {
  configureRereleaseMode,
  hasChangesetFiles,
  createChangesetsForRecentCommits,
  publishPackages,
} from './changeset';
import { ensureChangesetsAvailable } from './changeset/ensure-changesets-available';
import { runChangesetVersion } from './changeset/run-changeset-version';
import { getActionInputs, getBranchConfig, validateBranchConfiguration } from './config';
import { configureGit, commitAndPush } from './git';
import { createReleasesForPackages } from './github/create-releases-for-packages';
import { pushChangesetTags } from './github/push-changeset-tags';
import { getPackagesToRelease } from './utils/get-release-plan';

/**
 * The main function for the action.
 */
export async function run(): Promise<void> {
  try {
    // Ensure changesets is available
    ensureChangesetsAvailable();

    // Initialize inputs and configuration
    const {
      githubToken,
      npmToken,
      botName,
      branches,
      createRelease: shouldCreateRelease,
      pushTags,
      autoChangeset,
    } = getActionInputs();
    const branchConfig = getBranchConfig(branches);

    // Validate branch configuration
    if (!validateBranchConfiguration(branchConfig)) {
      return;
    }

    // Configure Git user
    const git = await configureGit(botName);

    // Manage pre-release mode based on branch configuration
    configureRereleaseMode(branchConfig);

    if (autoChangeset) {
      await createChangesetsForRecentCommits();
    }

    // Ensure we have changesets to work with
    const hasChangesetReleaseFiles = hasChangesetFiles();

    // Version and push changes if we have changesets
    if (hasChangesetReleaseFiles) {
      core.info('Processing versioning and git operations...');

      // Get packages that will be released BEFORE running changeset version
      // because changeset version consumes the changeset files
      const packagesToRelease = await getPackagesToRelease();

      runChangesetVersion(githubToken);

      await commitAndPush(git, githubToken, packagesToRelease);

      // Publish to npm if token is provided
      if (npmToken) {
        const releasedPackages = await publishPackages(branchConfig, npmToken);
        core.info('Packages published successfully!');

        // NOW push the tags that were created by changeset publish
        const repo = process.env.GITHUB_REPOSITORY;
        if (repo && githubToken && pushTags) {
          try {
            if (releasedPackages.length > 0) {
              await pushChangesetTags(git, githubToken, repo);
              // Create GitHub releases for published packages
              if (shouldCreateRelease) {
                await createReleasesForPackages({
                  releasedPackages,
                  githubToken,
                  repo,
                });
              }
            }
          } catch (error) {
            core.warning(`Failed to push tags: ${String(error)}`);
          }
        }
      } else {
        core.info('No npm token provided, skipping publish step.');
      }
    } else {
      core.info('No changesets to process. Action completed.');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    core.setFailed(`Action failed: ${errorMessage}`);
  }
}
