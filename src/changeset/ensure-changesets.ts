import * as core from '@actions/core';

import { checkForChangesetFiles, getChangesetFiles } from './changesets';
import { processChanges } from './process-changes';

/**
 * Ensures changesets exist, creating them if necessary
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
    const foundFiles = getChangesetFiles();
    core.info(
      `Existing changesets found. No need to create new ones.\nList of found changeset files: ${foundFiles.length ? foundFiles.join(', ') : 'None'}`,
    );
  }

  return hasChangesetFiles;
}
