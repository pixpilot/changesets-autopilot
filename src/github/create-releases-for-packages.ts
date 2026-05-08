import type { Package } from './create-release';
import { Octokit } from '@octokit/rest';

import { getPackages } from '../utils';
import { log } from '../utils/core';
import { createRelease } from './create-release';

export interface CreateReleasesOptions {
  releasedPackages: Package[];
  githubToken: string;
  repo: string;
  owner?: string;
  repoName?: string;
}

export async function createReleasesForPackages({
  releasedPackages,
  githubToken,
  repo,
  owner,
  repoName,
}: CreateReleasesOptions): Promise<void> {
  const { isMonorepo } = await getPackages();

  log.info('Creating GitHub releases for published packages...');
  const octokit = new Octokit({ auth: githubToken });
  const [repoOwner, repoNameLocal] = repo.split('/');
  const finalOwner = owner ?? repoOwner;
  const finalRepoName = repoName ?? repoNameLocal;

  await Promise.all(
    releasedPackages.map(async (pkg) => {
      const tagName = isMonorepo
        ? `${pkg.packageJson.name}@${pkg.packageJson.version}`
        : `v${pkg.packageJson.version}`;
      try {
        await createRelease(octokit, {
          pkg,
          tagName,
          owner: finalOwner,
          repo: finalRepoName,
        });
        log.info(`Created GitHub release for ${tagName}`);
      } catch (error) {
        log.warning(`Failed to create release for ${tagName}: ${String(error)}`);
      }
    }),
  );
}
