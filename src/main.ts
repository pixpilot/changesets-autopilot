import process from 'node:process';

import {
  configureRereleaseMode,
  createChangesetsForRecentCommits,
  hasChangesetFiles,
  publishPackages,
} from './changeset';
import { ensureChangesetsAvailable } from './changeset/ensure-changesets-available';
import { runChangesetVersion } from './changeset/run-changeset-version';
import { getActionInputs, getBranchConfig, validateBranchConfiguration } from './config';
import { commitAndPush, configureGit } from './git';
import { createReleasesForPackages } from './github/create-releases-for-packages';
import { pushChangesetTags } from './github/push-changeset-tags';
import { getPackagesToRelease } from './utils/get-release-plan';
import { log } from './utils/log';
import { getCustomPublishRegistries } from './utils/publish-registry';
import { validateOidcNodeRuntime } from './utils/validate-oidc-node-runtime';
import { validatePublishAuth } from './utils/validate-publish-auth';

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
      registryToken,
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
      const hasRegistryToken =
        typeof registryToken === 'string' && registryToken.length > 0;
      if (!hasRegistryToken) {
        // Validate before versioning/pushing so an unpublishable auth setup
        // does not leave a release commit behind.
        const customRegistries = await getCustomPublishRegistries();
        validatePublishAuth(hasRegistryToken, customRegistries);
        validateOidcNodeRuntime();
      }

      log.info('Processing versioning and git operations...');

      // Get packages that will be released BEFORE running changeset version
      // because changeset version consumes the changeset files
      const packagesToRelease = await getPackagesToRelease();

      runChangesetVersion(githubToken);

      await commitAndPush(git, githubToken, packagesToRelease);

      if (hasRegistryToken) {
        log.info('Using npm authentication mode: token mode');
      } else {
        log.info('Using npm authentication mode: OIDC trusted publisher mode');
      }

      const provenance = log.getInput('provenance') === 'true';
      const releasedPackages = await publishPackages(
        branchConfig,
        registryToken,
        provenance,
      );

      if (packagesToRelease.length > 0 && releasedPackages.length === 0) {
        throw new Error(
          `Publishing failed: expected to publish ${packagesToRelease.length} package(s), but none were published.`,
        );
      }

      log.info('Packages published successfully!');

      // Set published output based on whether any packages were actually released
      const wasPublished = releasedPackages.length > 0;
      log.setOutput('published', wasPublished.toString());

      // NOW push the tags that were created by changeset publish
      const repo = process.env.GITHUB_REPOSITORY;
      const hasRepo = typeof repo === 'string' && repo.length > 0;
      const hasGithubToken = githubToken.length > 0;
      if (hasRepo && hasGithubToken && pushTags) {
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
      }
    } else {
      log.info('No changesets to process. Action completed.');
      log.setOutput('published', 'false');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.setOutput('published', 'false');
    log.setFailed(`Action failed: ${errorMessage}`);
  }
}
