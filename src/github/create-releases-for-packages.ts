import * as core from '@actions/core';
import { Octokit } from '@octokit/rest';

import { createRelease } from './create-release';
import type { Package } from './create-release';

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
  core.info('Creating GitHub releases for published packages...');
  const octokit = new Octokit({ auth: githubToken });
  const [repoOwner, repoNameLocal] = repo.split('/');
  const finalOwner = owner ?? repoOwner;
  const finalRepoName = repoName ?? repoNameLocal;

  await Promise.all(
    releasedPackages.map(async (pkg) => {
      const tagName = `${pkg.packageJson.name}@${pkg.packageJson.version}`;
      try {
        await createRelease(octokit, {
          pkg,
          tagName,
          owner: finalOwner,
          repo: finalRepoName,
        });
        core.info(`Created GitHub release for ${tagName}`);
      } catch (error) {
        core.warning(`Failed to create release for ${tagName}: ${String(error)}`);
      }
    }),
  );
}
