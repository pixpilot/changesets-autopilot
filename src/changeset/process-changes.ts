import * as core from '@actions/core';

import { getChangesSinceLastCommit } from '../git/get-changes';
import { getChangeTypeAndDescription } from '../utils/commit-parser';

import { createChangesetFile } from './create-changeset-file';

/**
 * Processes changes since last commit and creates changeset files for each package
 * with commits.
 */
export async function processChanges(): Promise<void> {
  const changes = await getChangesSinceLastCommit();
  for (const [packageName, info] of Object.entries(changes)) {
    if (info.commits.length > 0) {
      for (const commit of info.commits) {
        const { changeType, description } = await getChangeTypeAndDescription(
          commit.message,
        );
        createChangesetFile(packageName, changeType, description);
        core.info(
          `Created changeset for package '${packageName}' with change type '${changeType}' and description '${description}'`,
        );
      }
    }
  }
}
