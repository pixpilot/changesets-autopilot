import fs from 'fs';
import path from 'path';

import simpleGit from 'simple-git';
import type { SimpleGit } from 'simple-git';

/**
 * Configures the Git user with the provided bot name.
 * @param botName - The name of the bot to use for Git user configuration.
 * @returns {Promise<SimpleGit>} The configured SimpleGit instance.
 */
export async function configureGit(botName: string): Promise<SimpleGit> {
  // Remove .git/config.lock if it exists to prevent locking errors
  const gitDir = path.resolve(process.cwd(), '.git');
  const configLockPath = path.join(gitDir, 'config.lock');
  if (fs.existsSync(configLockPath)) {
    fs.unlinkSync(configLockPath);
  }
  const git = simpleGit();

  // Use GitHub's recognized bot user ID and email format for proper bot avatar
  // The user ID 41898282 is GitHub's standard bot user ID that ensures proper bot icon display
  await git.addConfig('user.name', `${botName}[bot]`);
  await git.addConfig('user.email', `41898282+${botName}[bot]@users.noreply.github.com`);
  return git;
}
