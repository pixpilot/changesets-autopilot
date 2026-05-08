import type simpleGit from 'simple-git';
import { isVersionOrReleaseCommit } from '../utils/commit-validator';
import { log } from '../utils/core';

/**
 * Finds the last published commit by looking for release tags or published commits
 */
export async function findLastPublishedCommit(
  git: ReturnType<typeof simpleGit>,
): Promise<string> {
  try {
    // First, try to find the most recent release tag
    const tags = await git.tags(['--sort=-version:refname', '--merged']);
    if (tags.all.length > 0) {
      // Find the first tag that looks like a version tag
      for (const tag of tags.all) {
        if (/^v?\d+\.\d+\.\d+/u.test(tag)) {
          log.info(`Using last release tag as base: ${tag}`);
          return tag;
        }
      }
    }

    // No version tags found, try commit history
    log.info('No version tags found, searching commit history for published releases');

    // If no version tags found, look through commit history for the last published commit
    const gitLog = await git.log({ maxCount: 80 });

    // Look for commits that indicate a published release
    for (const commit of gitLog.all) {
      if (isVersionOrReleaseCommit(commit.message)) {
        log.info(`Using last published release commit as base: ${commit.hash}`);
        return commit.hash;
      }
    }

    // If no published commits found, look for the last commit that would create publishable changes
    // by finding commits that are not version/merge commits
    for (const [index, commit] of gitLog.all.entries()) {
      if (!isVersionOrReleaseCommit(commit.message)) {
        // This might be a publishable commit, but we want to find what was published before it
        if (index < gitLog.all.length - 1) {
          log.info(
            `Using commit before last publishable commit as base: ${gitLog.all[index + 1].hash}`,
          );
          return gitLog.all[index + 1].hash;
        }
      }
    }

    // Fallback to HEAD~1 if no clear base found
    log.info('No clear base commit found, falling back to HEAD~1');
    return 'HEAD~1';
  } catch (error) {
    log.warning(
      `Error finding last publishable commit: ${String(error)}, falling back to HEAD~1`,
    );
    return 'HEAD~1';
  }
}
