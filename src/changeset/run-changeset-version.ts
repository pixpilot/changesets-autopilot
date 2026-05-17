import { execSync } from 'node:child_process';
import process from 'node:process';

import { log } from '../utils/log';

/**
 * Runs the 'changeset version' command to apply version updates based on changeset files.
 * This is typically used in release automation workflows to version packages before publishing.
 * The function logs output and errors using GitHub Actions core logging.
 *
 * @param githubToken - GitHub token for authentication in CI environments
 */
export function runChangesetVersion(githubToken: string): void {
  try {
    log.info('Running changeset version command...');
    const versionOutput = execSync('npx changeset version', {
      encoding: 'utf8',
      cwd: process.cwd(),
      env: {
        ...process.env,
        GITHUB_TOKEN: githubToken,
      },
    });
    log.info(versionOutput);
    log.info('Changeset version completed successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Changeset version failed: ${errorMessage}`);
  }
}
