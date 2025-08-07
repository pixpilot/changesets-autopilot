import fs from 'node:fs/promises';
import path from 'node:path';

import * as core from '@actions/core';
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

function getPreviousVersion(changelog: string, currentVersion: string): string | null {
  const lines = changelog.split('\n');
  let foundCurrent = false;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('## ')) {
      if (foundCurrent) {
        // This is the previous version
        const versionRegex = /## (.+?)(?:\s|$)/;
        const versionMatch = versionRegex.exec(trimmedLine);
        if (versionMatch) {
          return versionMatch[1].trim();
        }
      } else if (trimmedLine.includes(currentVersion)) {
        // Found the current version, next version section will be the previous one
        foundCurrent = true;
      }
    }
  }

  return null;
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
    core.error(`Failed to read changelog for ${pkg.packageJson.name}: ${String(err)}`);
    return;
  }
  const changelogEntry = getChangelogEntry(changelog, pkg.packageJson.version);
  if (!changelogEntry) {
    core.warning(
      `Could not find changelog entry for ${pkg.packageJson.name}@${pkg.packageJson.version}. skipping release creation.`,
    );
    return;
  }

  // Create a formatted release title with version and date
  const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const releaseTitle = `${tagName}`;

  // Find the previous version for comparison link
  const previousVersion = getPreviousVersion(changelog, pkg.packageJson.version);
  let comparisonUrl = '';
  let releaseBodyHeader = `## ${changelogEntry.changeLevel}(${currentDate})`;

  if (previousVersion) {
    const previousTag = tagName.replace(pkg.packageJson.version, previousVersion);
    comparisonUrl = `https://github.com/${owner}/${repo}/compare/${previousTag}...${tagName}`;
    // Make the release title a clickable link to the comparison
    releaseBodyHeader = `## [${releaseTitle}](${comparisonUrl})`;
  } else {
    // If no previous version, just show the release title without link
    releaseBodyHeader = `## ${releaseTitle}`;
  }

  // Create a formatted release body
  const releaseBody = `${releaseBodyHeader}

${changelogEntry.content}`;

  await octokit.repos.createRelease({
    owner,
    repo,
    name: releaseTitle,
    tag_name: tagName,
    body: releaseBody,
    prerelease: pkg.packageJson.version.includes('-'),
    generate_release_notes: true,
    make_latest: 'false',
  });
};
