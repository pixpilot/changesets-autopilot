import { execSync } from 'child_process';

interface IsGitRepoOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}

/**
 * Check if current directory is a git repository
 * @param options Options object
 * @return True if it's a git repo
 */
export function isGitRepo(options: IsGitRepoOptions = {}): boolean {
  const { cwd = process.cwd(), env = process.env } = options;
  try {
    execSync('git rev-parse --git-dir', {
      cwd,
      env: { ...process.env, ...env },
      stdio: 'pipe',
    });
    return true;
  } catch (_error) {
    return false;
  }
}
