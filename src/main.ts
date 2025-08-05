import * as core from '@actions/core';
import { Octokit } from '@octokit/rest';

import { configurePrereleaseMode, ensureChangesets } from './changeset';
import { ensureChangesetsAvailable } from './changeset/ensure-changesets-available';
import { getActionInputs, getBranchConfig, validateBranchConfiguration } from './config';
import { configureGit, gitVersionAndPush } from './git';
import { createRelease } from './github/create-release';
import { publishPackages } from './publisher';

/**
 * The main function for the action.
 */
export async function run(): Promise<void> {
  try {
    // Ensure changesets is available
    ensureChangesetsAvailable();

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
        const releasedPackages = await publishPackages(branchConfig, npmToken);
        core.info('Packages published successfully!');

        // NOW push the tags that were created by changeset publish
        const repo = process.env.GITHUB_REPOSITORY;
        if (repo && githubToken) {
          try {
            core.info('Pushing tags created by changeset publish to GitHub...');
            await git.pushTags(`https://${githubToken}@github.com/${repo}.git`);
            core.info('Tags pushed successfully');

            // Create GitHub releases for published packages
            if (releasedPackages.length > 0) {
              core.info('Creating GitHub releases for published packages...');
              const octokit = new Octokit({ auth: githubToken });
              const [owner, repoName] = repo.split('/');

              await Promise.all(
                releasedPackages.map(async (pkg) => {
                  const tagName = `${pkg.packageJson.name}@${pkg.packageJson.version}`;
                  try {
                    await createRelease(octokit, { pkg, tagName, owner, repo: repoName });
                    core.info(`Created GitHub release for ${tagName}`);
                  } catch (error) {
                    core.warning(
                      `Failed to create release for ${tagName}: ${String(error)}`,
                    );
                  }
                }),
              );
            } else {
              core.info('No packages were published, skipping release creation');
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

    core.info('Changeset autopilot completed successfully!');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    core.setFailed(`Action failed: ${errorMessage}`);
  }
}
