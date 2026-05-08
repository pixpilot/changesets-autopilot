import type { SimpleGit } from 'simple-git';
import type { ReleasePackage } from '../utils/get-release-plan';

import { log } from '../utils/core';
import { getReleaseCommitMessage } from '../utils/get-release-commit-message';

export async function commitReleaseChanges(
  git: SimpleGit,
  packagesToRelease: ReleasePackage[],
): Promise<string> {
  // Use utility to get commit message
  const commitMessage = getReleaseCommitMessage(packagesToRelease);

  await git.add('.');
  try {
    await git.commit(commitMessage);
    log.info('Git commit successful');
  } catch (e) {
    log.info(`Git commit failed: ${String(e)}`);
  }

  return commitMessage;
}
