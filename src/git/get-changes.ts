import path from 'path';

import * as core from '@actions/core';
import simpleGit from 'simple-git';

import type { ChangesMap, PackageChange, Commit } from '../../types/changes';
import { getChangeTypeAndDescription } from '../utils/commit-parser';
import { isVersionOrReleaseCommit } from '../utils/commit-validator';
import { getSelectedPackagesInfo } from '../utils/select-packages-info';

import { findLastPublishedCommit } from './find-last-published-commit';

export async function getChangesSinceLastCommit() {
  const { publishablePackages, privatePackages, isMonorepo } =
    await getSelectedPackagesInfo();

  const git = simpleGit();

  if (!isMonorepo) {
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
      if (isVersionOrReleaseCommit(commit.message)) {
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
    publishablePackages.forEach((pkg) => {
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
