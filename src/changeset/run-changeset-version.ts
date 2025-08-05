import { execSync } from 'child_process';

import * as core from '@actions/core';

/**
 * Runs the 'changeset version' command to apply version updates based on changeset files.
 * This is typically used in release automation workflows to version packages before publishing.
 * The function logs output and errors using GitHub Actions core logging.
 *
 * @param githubToken - GitHub token for authentication in CI environments
 */
export function runChangesetVersion(githubToken: string) {
  try {
    core.info('Running changeset version command...');
    const versionOutput = execSync('npx changeset version', {
      encoding: 'utf8',
      cwd: process.cwd(),
      env: {
        ...process.env,
        GITHUB_TOKEN: githubToken,
      },
    });
    core.info(versionOutput);
    core.info('Changeset version completed successfully');
  } catch (error) {
    core.info(`Error message: ${(error as Error).message}`);
    return;
  }
}
