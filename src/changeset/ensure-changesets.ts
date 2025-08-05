import * as core from '@actions/core';

import { checkForChangesetFiles, getAllChangesetFiles } from './changesets';
import { processChanges } from './process-changes';

/**
 * Ensures changesets exist, creating them if necessary
 * Only considers manual changesets when determining if new ones are needed.
 * Auto-generated files from previous runs are ignored for this purpose.
 */
export async function ensureChangesets(): Promise<boolean> {
  let hasChangesetFiles = checkForChangesetFiles();

  if (!hasChangesetFiles) {
    core.info(
      'No existing changesets found. Running autopilot to create release notes...',
    );
    await processChanges();
    hasChangesetFiles = checkForChangesetFiles();

    if (!hasChangesetFiles) {
      core.info('No changes detected that require versioning.');
    }
  } else {
    // Show all changeset files (including auto-generated ones) for transparency
    const foundFiles = getAllChangesetFiles();
    const autoFiles = foundFiles.filter((file) => file.startsWith('auto-generated-at-'));

    core.info(
      `Existing changesets found. No need to create new ones.\nList of found changeset files: ${foundFiles.length ? foundFiles.join(', ') : 'None'}`,
    );

    if (autoFiles.length > 0) {
      core.info(
        `Note: ${autoFiles.length} auto-generated files from previous runs will be cleaned up after publishing.`,
      );
    }
  }

  return hasChangesetFiles;
}
