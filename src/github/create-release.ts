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
  let changeLevel = 'Unknown';

  // Find the version section
  for (let i = 0; i < lines.length; i++) {
    const trimmedLine = lines[i].trim();
    if (trimmedLine.startsWith('## ') && trimmedLine.includes(version)) {
      start = i;

      // Look for the next version section to determine the end
      for (let j = i + 1; j < lines.length; j++) {
        const nextTrimmedLine = lines[j].trim();
        if (nextTrimmedLine.startsWith('## ')) {
          end = j;
          break;
        }
      }

      // Detect the change level (Major, Minor, Patch Changes)
      for (let k = i + 1; k < end; k++) {
        const line = lines[k].trim();
        if (line.startsWith('### ')) {
          if (line.includes('Major Changes')) {
            changeLevel = 'Major Changes';
          } else if (line.includes('Minor Changes')) {
            changeLevel = 'Minor Changes';
          } else if (line.includes('Patch Changes')) {
            changeLevel = 'Patch Changes';
          }
          break;
        }
      }
      break;
    }
  }

  if (start === -1) return null;

  // Extract content starting from after the version header
  const contentLines = lines.slice(start + 1, end);

  // Remove empty lines at the beginning
  while (contentLines.length > 0 && contentLines[0].trim() === '') {
    contentLines.shift();
  }

  // Remove empty lines at the end
  while (contentLines.length > 0 && contentLines[contentLines.length - 1].trim() === '') {
    contentLines.pop();
  }

  return {
    content: contentLines.join('\n'),
    changeLevel,
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

  // Create a formatted release body
  const releaseBody = `## ${changelogEntry.changeLevel}

${changelogEntry.content}`;

  await octokit.repos.createRelease({
    owner,
    repo,
    name: tagName,
    tag_name: tagName,
    body: releaseBody,
    prerelease: pkg.packageJson.version.includes('-'),
  });
};
