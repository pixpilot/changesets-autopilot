import fs from 'node:fs/promises';
import path from 'node:path';

import type { Octokit } from '@octokit/rest';

export interface Package {
  dir: string;
  packageJson: {
    name: string;
    version: string;
    private?: boolean;
  };
}

function isErrorWithCode(err: unknown, code: string) {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === code
  );
}

function getChangelogEntry(changelog: string, version: string) {
  const lines = changelog.split('\n');
  let start = -1;
  let end = lines.length;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith(`#`) && lines[i].includes(version)) {
      start = i;
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].trim().startsWith(`#`)) {
          end = j;
          break;
        }
      }
      break;
    }
  }
  if (start === -1) return null;
  return {
    content: lines.slice(start, end).join('\n'),
    highestLevel: 0,
  };
}

/**
 * Creates a GitHub release for a given package and tag.
 * @param octokit - Authenticated Octokit instance
 * @param pkg - The package object
 * @param tagName - The tag name for the release
 * @param owner - GitHub repo owner
 * @param repo - GitHub repo name
 */
export const createRelease = async (
  octokit: Octokit,
  {
    pkg,
    tagName,
    owner,
    repo,
  }: { pkg: Package; tagName: string; owner: string; repo: string },
) => {
  let changelog;
  try {
    changelog = await fs.readFile(path.join(pkg.dir, 'CHANGELOG.md'), 'utf8');
  } catch (err) {
    if (isErrorWithCode(err, 'ENOENT')) {
      return;
    }
    throw err;
  }
  const changelogEntry = getChangelogEntry(changelog, pkg.packageJson.version);
  if (!changelogEntry) {
    throw new Error(
      `Could not find changelog entry for ${pkg.packageJson.name}@${pkg.packageJson.version}`,
    );
  }

  await octokit.repos.createRelease({
    owner,
    repo,
    name: tagName,
    tag_name: tagName,
    body: changelogEntry.content,
    prerelease: pkg.packageJson.version.includes('-'),
  });
};
