import path from 'path';

import * as core from '@actions/core';
import { getPackages } from '@manypkg/get-packages';
import simpleGit from 'simple-git';

import type { ChangesMap, PackageChange, Commit } from '../../types/changes';
import { getChangeTypeAndDescription } from '../utils/commit-parser';

export async function getChangesSinceLastCommit() {
  const git = simpleGit();
  const { packages } = await getPackages(process.cwd());

  // For single-package repos (GitHub Actions, etc.), we still want to process the root package
  // even if it's marked as private, since that's the package we want to version
  const isSinglePackageRepo = packages.length === 1 && packages[0].relativeDir === '.';

  // Filter out private packages, but keep the root package for single-package repos
  const publicPackages = packages.filter(
    (pkg) => !pkg.packageJson.private || (isSinglePackageRepo && pkg.relativeDir === '.'),
  );
  const privatePackages = packages.filter(
    (pkg) => pkg.packageJson.private && !(isSinglePackageRepo && pkg.relativeDir === '.'),
  );

  if (isSinglePackageRepo) {
    core.info('Detected single-package repository');
  }

  if (privatePackages.length > 0) {
    core.info(
      'Skipped private packages: ' +
        privatePackages.map((pkg) => pkg.packageJson.name).join(', '),
    );
  }

  try {
    // Find the base commit to compare against
    const baseCommit = await findLastPublishedCommit(git);
    core.info(`Found base commit for comparison: ${baseCommit}`);

    // Get changed files since the base commit
    const diff = await git.diff([baseCommit, 'HEAD', '--name-only']);
    const changedFiles = diff.split('\n').filter(Boolean);

    // Get all commits since the base commit
    const log = await git.log({
      from: baseCommit,
      to: 'HEAD',
    });

    // Filter commits to only include those that would create publishable changes
    const publishableCommits: Commit[] = [];

    for (const commit of log.all) {
      // Skip merge commits and version commits
      if (isMergeCommit(commit.message) || isVersionOrReleaseCommit(commit.message)) {
        continue;
      }

      // Check if this commit would result in a publishable change
      const { changeType } = getChangeTypeAndDescription(commit.message);
      if (changeType !== 'none') {
        publishableCommits.push({
          hash: commit.hash,
          date: commit.date,
          message: commit.message,
          refs: commit.refs,
          body: commit.body || '',
          author_name: commit.author_name,
          author_email: commit.author_email,
        });
      }
    }

    if (publishableCommits.length === 0) {
      core.info('No publishable commits found since base commit');
      return {};
    }

    core.info(
      `Found ${publishableCommits.length} publishable commits since ${baseCommit}`,
    );

    const changes: ChangesMap = {};

    // Only process public packages that have actual changes
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
 * Finds the last published commit by looking for release tags or published commits
 */
async function findLastPublishedCommit(
  git: ReturnType<typeof simpleGit>,
): Promise<string> {
  try {
    // First, try to find the most recent release tag
    const tags = await git.tags(['--sort=-version:refname', '--merged']);
    if (tags.all.length > 0) {
      // Find the first tag that looks like a version tag
      for (const tag of tags.all) {
        if (/^v?\d+\.\d+\.\d+/.test(tag)) {
          core.info(`Using last release tag as base: ${tag}`);
          return tag;
        }
      }
    }

    // If no version tags found, look through commit history for the last published commit
    const log = await git.log({ maxCount: 50 });

    // Look for commits that indicate a published release
    for (const commit of log.all) {
      if (isPublishedReleaseCommit(commit.message)) {
        core.info(`Using last published release commit as base: ${commit.hash}`);
        return commit.hash;
      }
    }

    // If no published commits found, look for the last commit that would create publishable changes
    // by finding commits that are not version/merge commits
    for (const [index, commit] of log.all.entries()) {
      if (!isVersionOrReleaseCommit(commit.message) && !isMergeCommit(commit.message)) {
        // This might be a publishable commit, but we want to find what was published before it
        if (index < log.all.length - 1) {
          core.info(
            `Using commit before last publishable commit as base: ${log.all[index + 1].hash}`,
          );
          return log.all[index + 1].hash;
        }
      }
    }

    // Fallback to HEAD~1 if no clear base found
    core.info('No clear base commit found, falling back to HEAD~1');
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

/**
 * Checks if a commit message indicates a published release commit
 */
function isPublishedReleaseCommit(message: string): boolean {
  const publishedPatterns = [
    /^chore\(release\):/i,
    /^version packages/i,
    /release.*\[skip ci\]/i,
    /published/i,
  ];

  return publishedPatterns.some((pattern) => pattern.test(message.trim()));
}

/**
 * Checks if a commit message indicates a merge commit
 */
function isMergeCommit(message: string): boolean {
  const mergePatterns = [/^merge\s+/i, /^merge pull request/i, /^merge branch/i];
  return mergePatterns.some((pattern) => pattern.test(message.trim()));
}
