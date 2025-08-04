import { execSync } from 'child_process';

/**
 * Runs `npx changeset version` in the current working directory with the provided GitHub token.
 * Throws if the command fails.
 * @param githubToken - The GitHub token to pass in the environment (optional)
 * @returns The stdout from the command
 */
export function runChangesetCommand(command: string, githubToken?: string): string {
  const env = { ...process.env };
  if (githubToken) {
    env.GITHUB_TOKEN = githubToken;
  }
  return execSync(`npx changeset ${command}`, {
    encoding: 'utf8',
    cwd: process.cwd(),
    env,
  });
}
