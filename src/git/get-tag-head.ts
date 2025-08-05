import { execSync } from 'child_process';

interface GetTagHeadOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}

/**
 * Get the commit sha for a given tag.
 *
 * @param tagName Tag name for which to retrieve the commit sha.
 * @param options Options object.
 * @return The commit sha of the tag in parameter or `null`.
 */
export function getTagHead(
  tagName: string,
  options: GetTagHeadOptions = {},
): string | null {
  const { cwd = process.cwd(), env = process.env } = options;
  try {
    const result = execSync(`git rev-list -1 ${tagName}`, {
      cwd,
      env: { ...process.env, ...env },
      encoding: 'utf8',
      stdio: 'pipe',
    });
    return result.trim();
  } catch (error) {
    return null;
  }
}
