import * as core from '@actions/core';
import type { SimpleGit } from 'simple-git';

import { getReleaseCommitMessage } from '../utils/get-release-commit-message';
import { getPackagesToRelease } from '../utils/get-release-plan';

export async function commitReleaseChanges(git: SimpleGit): Promise<string> {
  let packagesToRelease: Awaited<ReturnType<typeof getPackagesToRelease>> = [];

  // Get packages that will be released BEFORE running changeset version
  // because changeset version consumes the changeset files
  packagesToRelease = await getPackagesToRelease();

  // Use utility to get commit message
  const commitMessage = getReleaseCommitMessage(packagesToRelease);

  await git.add('.');
  try {
    await git.commit(commitMessage);
    core.info('Git commit successful');
  } catch (e) {
    core.info(`Git commit failed: ${String(e)}`);
  }

  return commitMessage;
}
