import type { SimpleGit } from 'simple-git';
import type { ReleasePackage } from '../utils/get-release-plan';

import { getReleaseCommitMessage } from '../utils/get-release-commit-message';
import { log } from '../utils/log';

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
    const errorMessage = e instanceof Error ? e.message : String(e);
    throw new Error(`Git commit failed: ${errorMessage}`);
  }

  return commitMessage;
}
