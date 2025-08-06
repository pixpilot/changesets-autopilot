import * as core from '@actions/core';
import { parse } from 'yaml';

import type { ActionInputs, BranchConfig } from '../../types';

export function getActionInputs(): ActionInputs {
  const branchesInput =
    core.getInput('BRANCHES') ||
    `- main
- name: next
  prerelease: rc
  channel: next`;
  let branches: (string | BranchConfig)[];
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const parsed = parse(branchesInput);
    if (Array.isArray(parsed)) {
      branches = parsed as (string | BranchConfig)[];
    } else {
      throw new Error('BRANCHES input must be a YAML array');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    core.warning(
      `Failed to parse BRANCHES input: ${errorMessage}. Using default configuration.`,
    );
    branches = ['main', { name: 'next', prerelease: 'rc', channel: 'next' }];
  }
  const shouldCreateReleaseInput = core.getInput('CREATE_RELEASE') || 'true';
  const shouldCreateRelease = shouldCreateReleaseInput.toLowerCase() === 'true';
  const shouldPushTagsInput = core.getInput('PUSH_TAGS') || 'true';
  const pushTags = shouldPushTagsInput.toLowerCase() === 'true';
  const shouldAutoChangesetInput = core.getInput('AUTO_CHANGESET') || 'false';
  const autoChangeset = shouldAutoChangesetInput.toLowerCase() === 'true';
  const shouldGroupReleasesInput = core.getInput('GROUP_RELEASES') || 'false';
  const groupReleases = shouldGroupReleasesInput.toLowerCase() === 'true';
  const packageGroupsInput = core.getInput('PACKAGE_GROUPS') || '{}';
  let packageGroups: Record<string, string[]> = {};

  try {
    packageGroups = JSON.parse(packageGroupsInput) as Record<string, string[]>;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    core.warning(
      `Failed to parse PACKAGE_GROUPS input: ${errorMessage}. Using empty groups.`,
    );
    packageGroups = {};
  }

  return {
    githubToken: core.getInput('GITHUB_TOKEN', { required: true }),
    npmToken: core.getInput('NPM_TOKEN', { required: true }),
    botName: core.getInput('BOT_NAME') || 'changesets-autopilot',
    branches,
    createRelease: shouldCreateRelease,
    pushTags,
    autoChangeset,
    groupReleases,
    packageGroups,
  };
}
