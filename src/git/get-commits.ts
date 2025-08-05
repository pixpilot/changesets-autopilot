import { execSync } from 'child_process';

import { extractGitTags } from './extract-git-tags';

interface GetCommitsOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  maxCount?: number;
}

export interface Commit {
  hash: string;
  message: string;
  body: string;
  author_name: string;
  author_email: string;
  date: string;
  refs: string;
  gitTags: string[];
}

/**
 * Retrieve a range of commits.
 *
 * @param from SHA to start from (exclusive). If null/undefined, gets all commits.
 * @param to SHA to end at (inclusive). Defaults to 'HEAD'.
 * @param options Options object.
 * @return The list of commits between `from` and `to`.
 */
export function getCommits(
  from?: string,
  to = 'HEAD',
  options: GetCommitsOptions = {},
): Commit[] {
  const { cwd = process.cwd(), env = process.env, maxCount } = options;
  const range = from ? `${from}..${to}` : to;
  const args = [
    'git',
    'log',
    '--format=%H%n%s%n%b%n%an%n%ae%n%ai%n%d%n---COMMIT-END---',
    ...(maxCount ? [`--max-count=${maxCount}`] : []),
    range,
  ];
  try {
    const result = execSync(args.join(' '), {
      cwd,
      env: { ...process.env, ...env },
      encoding: 'utf8',
      stdio: 'pipe',
    });
    if (!result.trim()) {
      return [];
    }
    return result
      .split('---COMMIT-END---')
      .filter((commit) => commit.trim())
      .map((commit) => {
        const lines = commit.trim().split('\n');
        const [hash, subject, ...rest] = lines;
        const bodyLines: string[] = [];
        const infoStartIndex = rest.length - 4;
        for (let i = 0; i < infoStartIndex; i++) {
          bodyLines.push(rest[i]);
        }
        const [author_name, author_email, date, refs] = rest.slice(infoStartIndex);
        return {
          hash: hash || '',
          message: subject || '',
          body: bodyLines.join('\n').trim(),
          author_name: author_name || '',
          author_email: author_email || '',
          date: date || '',
          refs: (refs || '').trim(),
          gitTags: extractGitTags(refs || ''),
        };
      });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get commits: ${error.message}`);
    }
    throw error;
  }
}
