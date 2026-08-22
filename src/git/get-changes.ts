import type { SimpleGit } from 'simple-git';

import type { ChangesMap, Commit, PackageChange } from '../../types/changes';

import path from 'node:path';
import process from 'node:process';
import simpleGit from 'simple-git';
import { getChangeTypeAndDescription } from '../utils/commit-parser';
import { isVersionOrReleaseCommit } from '../utils/commit-validator';
import { getPackages } from '../utils/get-packages';
import { log } from '../utils/log';

import { findLastPublishedCommit } from './find-last-published-commit';

interface CommitFiles {
  commit: Commit;
  files: string[];
}

function parseFileList(diff: string): string[] {
  return diff
    .split('\n')
    .map((file) => file.trim())
    .filter(Boolean);
}

/**
 * Returns the files touched by a single commit.
 *
 * Attribution has to be resolved per commit: a range diff only says which
 * packages changed somewhere in the range, not which commit changed them, so
 * using it directly attributes every commit to every touched package.
 *
 * Falling back to the range diff when a commit cannot be resolved (a root commit
 * has no parent, for example) is deliberate. Over-attributing produces a
 * redundant changeset, while dropping the commit would silently lose a release.
 */
async function getFilesForCommit(
  git: SimpleGit,
  commit: Commit,
  fallbackFiles: string[],
): Promise<CommitFiles> {
  try {
    const diff = await git.diff([`${commit.hash}^!`, '--name-only']);
    return { commit, files: parseFileList(diff) };
  } catch (error) {
    log.warning(
      `Could not resolve changed files for commit ${commit.hash}: ${String(error)}. Falling back to the full range diff.`,
    );
    return { commit, files: fallbackFiles };
  }
}

function getPackageRelativeDir(packageDir: string): string {
  return path.relative(process.cwd(), packageDir).replace(/\\/gu, '/');
}

function filterFilesForPackage(
  files: string[],
  packagePath: string,
  isMonorepo: boolean,
): string[] {
  // In a single-package repo the package owns the whole tree, including root files.
  if (!isMonorepo && (packagePath === '.' || packagePath === '')) {
    return files;
  }
  return files.filter((file) => file.startsWith(`${packagePath}/`));
}

function addFiles(change: PackageChange, files: string[]): void {
  for (const file of files) {
    if (!change.files.includes(file)) {
      change.files.push(file);
    }
  }
}

export async function getChangesSinceLastCommit(): Promise<ChangesMap> {
  const { publishablePackages, privatePackages, isMonorepo } = await getPackages();

  const git = simpleGit();

  if (!isMonorepo) {
    log.info('Detected single-package repository');
  }

  if (privatePackages.length > 0) {
    log.info(
      `Skipped private packages: ${privatePackages.map((pkg) => pkg.packageJson.name).join(', ')}`,
    );
  }

  try {
    // Find the base commit to compare against
    const baseCommit = await findLastPublishedCommit(git);
    log.info(`Found base commit for comparison: ${baseCommit}`);

    // Range diff, used only as a fallback when a single commit cannot be resolved
    const rangeDiff = await git.diff([baseCommit, 'HEAD', '--name-only']);
    const rangeFiles = parseFileList(rangeDiff);

    // Get all commits since the base commit
    const gitLog = await git.log({
      from: baseCommit,
      to: 'HEAD',
    });

    // Filter commits to only include those that would create publishable changes
    const publishableCommits: Commit[] = [];

    for (const commit of gitLog.all) {
      // Skip merge commits and version commits
      if (!isVersionOrReleaseCommit(commit.message)) {
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
    }

    if (publishableCommits.length === 0) {
      log.info('No publishable commits found since base commit');
      return {};
    }

    log.info(
      `Found ${publishableCommits.length} publishable commits since ${baseCommit}`,
    );

    const commitFiles = await Promise.all(
      publishableCommits.map(async (commit) =>
        getFilesForCommit(git, commit, rangeFiles),
      ),
    );

    const changes = new Map<string, PackageChange>();

    // Attribute each commit only to the public packages that commit actually touched
    for (const { commit, files } of commitFiles) {
      for (const pkg of publishablePackages) {
        const packagePath = getPackageRelativeDir(pkg.dir);
        const packageFiles = filterFilesForPackage(files, packagePath, isMonorepo);

        if (packageFiles.length > 0) {
          const packageName = pkg.packageJson.name;
          const change = changes.get(packageName) ?? {
            files: [],
            commits: [],
            version: pkg.packageJson.version,
            private: pkg.packageJson.private ?? false,
          };
          changes.set(packageName, change);
          addFiles(change, packageFiles);
          change.commits.push(commit);
        }
      }
    }

    return Object.fromEntries(changes);
  } catch (error) {
    log.error(`Error getting changes: ${String(error)}`);
    return {};
  }
}
