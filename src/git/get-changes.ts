import path from 'path';

import * as core from '@actions/core';
import { getPackages } from '@manypkg/get-packages';
import simpleGit from 'simple-git';

import type { ChangesMap, PackageChange } from '../../types/changes';

export async function getChangesSinceLastCommit() {
  const git = simpleGit();
  const { packages } = await getPackages(process.cwd());
  // Filter out private packages
  const publicPackages = packages.filter((pkg) => !pkg.packageJson.private);
  const privatePackages = packages.filter((pkg) => pkg.packageJson.private);
  if (privatePackages.length > 0) {
    core.info(
      'Skipped private packages: ' +
        privatePackages.map((pkg) => pkg.packageJson.name).join(', '),
    );
  }

  try {
    // Find the last publishable commit by looking back through history
    const lastPublishableCommit = await findLastPublishableCommit(git);
    core.info(`Found last publishable commit: ${lastPublishableCommit}`);

    // Get changed files since the last publishable commit
    const diff = await git.diff([lastPublishableCommit, 'HEAD', '--name-only']);
    const changedFiles = diff.split('\n').filter(Boolean);

    // Get commits since the last publishable commit
    const log = await git.log({
      from: lastPublishableCommit,
      to: 'HEAD',
    });

    // Filter out version/release commits from the log
    const publishableCommits = log.all.filter(
      (commit) => !isVersionOrReleaseCommit(commit.message),
    );

    if (publishableCommits.length === 0) {
      core.info('No publishable commits found since last publishable commit');
      return {};
    }

    core.info(
      `Found ${publishableCommits.length} publishable commits since ${lastPublishableCommit}`,
    );

    const changes: ChangesMap = {};
    // Only process public packages
    publicPackages.forEach((pkg) => {
      const pkgPath = path.relative(process.cwd(), pkg.dir).replace(/\\/g, '/');
      const pkgChangedFiles = changedFiles.filter(
        (file) => file.startsWith(pkgPath + '/') || file === `${pkgPath}/package.json`,
      );
      if (pkgChangedFiles.length > 0) {
        changes[pkg.packageJson.name] = {
          files: pkgChangedFiles,
          commits: publishableCommits,
          version: pkg.packageJson.version,
          private: pkg.packageJson.private ?? false,
        } as PackageChange;
      }
    });
    return changes;
  } catch (error) {
    core.error('Error getting changes: ' + String(error));
    return {};
  }
}

/**
 * Finds the last publishable commit by looking back through history
 * and excluding version/release commits created by the action
 */
async function findLastPublishableCommit(
  git: ReturnType<typeof simpleGit>,
): Promise<string> {
  try {
    // Get recent commit history (up to 50 commits should be enough)
    const log = await git.log({ maxCount: 50 });

    // Look for the first non-version/release commit from the end
    for (let i = log.all.length - 1; i >= 0; i--) {
      const commit = log.all[i];
      if (!isVersionOrReleaseCommit(commit.message)) {
        // Found a publishable commit, return the commit before it as the base
        if (i === log.all.length - 1) {
          // If it's the oldest commit in our log, use HEAD~1 as fallback
          return 'HEAD~1';
        }
        return log.all[i + 1].hash;
      }
    }

    // If all recent commits are version/release commits, look for the last tag
    try {
      const tags = await git.tags(['--sort=-version:refname']);
      if (tags.latest) {
        core.info(`Using last tag as base: ${tags.latest}`);
        return tags.latest;
      }
    } catch (tagError) {
      core.warning(`Could not get tags: ${String(tagError)}`);
    }

    // Fallback to HEAD~1 if no tags found
    core.info('No publishable commits or tags found, falling back to HEAD~1');
    return 'HEAD~1';
  } catch (error) {
    core.warning(
      `Error finding last publishable commit: ${String(error)}, falling back to HEAD~1`,
    );
    return 'HEAD~1';
  }
}

/**
 * Checks if a commit message indicates a version or release commit
 */
function isVersionOrReleaseCommit(message: string): boolean {
  const versionPatterns = [
    /^chore\(release\):/i,
    /^version packages/i,
    /^\d+\.\d+\.\d+/,
    /^v\d+\.\d+\.\d+/,
    /^release/i,
    /\[skip ci\]/i,
    /\[ci skip\]/i,
    /^bump version/i,
    /^update version/i,
    /^prepare release/i,
  ];

  return versionPatterns.some((pattern) => pattern.test(message.trim()));
}
