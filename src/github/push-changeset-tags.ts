import type { SimpleGit } from 'simple-git';
import { log } from '../utils/core';

/**
 * Pushes tags created by changeset publish to GitHub.
 * @param git - The configured SimpleGit instance
 * @param githubToken - The GitHub token
 * @param repo - The repository name (owner/repo)
 */
export async function pushChangesetTags(
  git: SimpleGit,
  githubToken: string,
  repo: string,
): Promise<void> {
  log.info('Pushing tags created by changeset publish to GitHub...');
  await git.pushTags(`https://${githubToken}@github.com/${repo}.git`);
  log.info('Tags pushed successfully');
}
