import { execSync } from 'child_process';

interface GetGitHeadOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}

/**
 * Get the HEAD sha.
 *
 * @param options Options object.
 * @return The sha of the HEAD commit.
 */
export function getGitHead(options: GetGitHeadOptions = {}): string {
  const { cwd = process.cwd(), env = process.env } = options;
  try {
    const result = execSync('git rev-parse HEAD', {
      cwd,
      env: { ...process.env, ...env },
      encoding: 'utf8',
      stdio: 'pipe',
    });
    return result.trim();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get HEAD: ${error.message}`);
    }
    throw error;
  }
}
