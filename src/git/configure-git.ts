import simpleGit from 'simple-git';
import type { SimpleGit } from 'simple-git';

/**
 * Configures the Git user with the provided bot name.
 * @param botName - The name of the bot to use for Git user configuration.
 * @returns {Promise<SimpleGit>} The configured SimpleGit instance.
 */
export async function configureGit(botName: string): Promise<SimpleGit> {
  const git = simpleGit();
  await git.addConfig('user.name', `${botName}[bot]`);
  await git.addConfig('user.email', `${botName}[bot]@users.noreply.github.com`);
  return git;
}
