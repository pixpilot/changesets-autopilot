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
  const baseSha = 'HEAD~1';
  try {
    // Get changed files since last commit
    const diff = await git.diff([baseSha, 'HEAD', '--name-only']);
    const changedFiles = diff.split('\n').filter(Boolean);
    // Get commits
    const log = await git.log({
      from: baseSha,
      to: 'HEAD',
      maxCount: 1,
    });
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
          commits: log.all,
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
