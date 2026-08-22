import type simpleGit from 'simple-git';
import { isVersionOrReleaseCommit } from '../utils/commit-validator';
import { log } from '../utils/log';

async function resolveSafeFallbackBase(
  git: ReturnType<typeof simpleGit>,
): Promise<string> {
  if (typeof git.revparse !== 'function') {
    return 'HEAD';
  }

  try {
    await git.revparse(['--verify', 'HEAD~1']);
    return 'HEAD~1';
  } catch {
    const head = await git.revparse(['--verify', 'HEAD']);
    return head.trim() || 'HEAD';
  }
}

/**
 * Matches the release tags changesets creates, in both layouts:
 * `v1.2.3` / `1.2.3` for a single-package repo, and `pkg@1.2.3` /
 * `@scope/pkg@1.2.3` for a monorepo. Matching only the bare semver form would
 * miss every monorepo tag, which is the layout this action mainly targets.
 */
const VERSION_TAG_PATTERN = /^(?:.*@)?v?\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/u;

/**
 * Finds the last published commit by looking for release tags or published commits
 */
export async function findLastPublishedCommit(
  git: ReturnType<typeof simpleGit>,
): Promise<string> {
  try {
    // Sort by tag date rather than by refname: with monorepo tags a refname sort
    // orders by package name first, so the "highest" tag is an arbitrary package
    // rather than the most recent release.
    const tags = await git.tags(['--sort=-creatordate', '--merged']);
    if (tags.all.length > 0) {
      // Find the first tag that looks like a version tag
      for (const tag of tags.all) {
        if (VERSION_TAG_PATTERN.test(tag)) {
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

    // Fallback to a valid base commit reference in shallow/single-commit histories.
    const fallbackBase = await resolveSafeFallbackBase(git);
    log.info(`No clear base commit found, falling back to ${fallbackBase}`);
    return fallbackBase;
  } catch (error) {
    const fallbackBase = await resolveSafeFallbackBase(git);
    log.warning(
      `Error finding last publishable commit: ${String(error)}, falling back to ${fallbackBase}`,
    );
    return fallbackBase;
  }
}
