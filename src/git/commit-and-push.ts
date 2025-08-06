import type { SimpleGit } from 'simple-git';

import type { ReleasePackage } from '../utils/get-release-plan';

import { commitReleaseChanges } from './commit-release-changes';
import { pushBranch } from './push-branch';

export async function commitAndPush(
  git: SimpleGit,
  githubToken: string,
  packagesToRelease: ReleasePackage[],
) {
  // Use new helper to commit release changes
  const commitMessage = await commitReleaseChanges(git, packagesToRelease);

  await pushBranch(git, githubToken);

  return commitMessage;
}
