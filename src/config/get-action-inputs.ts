import type { ActionInputs, BranchConfig } from '../../types';
import * as core from '@actions/core';

import { parse } from 'yaml';

export function getActionInputs(): ActionInputs {
  const branchesInput =
    core.getInput('BRANCHES') ||
    `- main
- name: next
  prerelease: rc
  channel: next`;
  let branches: (string | BranchConfig)[];
  try {
    const parsed: unknown = parse(branchesInput);
    if (Array.isArray(parsed)) {
      branches = parsed as (string | BranchConfig)[];
    } else {
      throw new TypeError('BRANCHES input must be a YAML array');
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
  return {
    githubToken: core.getInput('GITHUB_TOKEN', { required: true }),
    npmToken: core.getInput('NPM_TOKEN') || undefined,
    botName: core.getInput('BOT_NAME') || 'changesets-autopilot',
    branches,
    createRelease: shouldCreateRelease,
    pushTags,
    autoChangeset,
  };
}
