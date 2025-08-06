import type { SimpleGit } from 'simple-git';

import { commitReleaseChanges } from './commit-release-changes';
import { pushBranch } from './push-branch';

export async function commitAndPush(git: SimpleGit, githubToken: string) {
  // Use new helper to commit release changes
  const commitMessage = await commitReleaseChanges(git);

  await pushBranch(git, githubToken);

  return commitMessage;
}
