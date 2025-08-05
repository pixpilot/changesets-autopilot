import { execSync } from 'child_process';

interface GetTagsOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}

/**
 * Get all the tags for a given branch.
 *
 * @param branch The branch for which to retrieve the tags.
 * @param options Options object.
 * @return List of git tags.
 * @throws If the `git` command fails.
 */
export function getTags(branch = 'HEAD', options: GetTagsOptions = {}): string[] {
  const { cwd = process.cwd(), env = process.env } = options;
  try {
    const result = execSync(`git tag --merged ${branch}`, {
      cwd,
      env: { ...process.env, ...env },
      encoding: 'utf8',
      stdio: 'pipe',
    });
    return result
      .split('\n')
      .map((tag) => tag.trim())
      .filter(Boolean);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get tags: ${error.message}`);
    }
    throw error;
  }
}
