import type { ActionInputs, BranchConfig } from '../../types';
import { parse } from 'yaml';
import { log } from '../utils/core';

export function getActionInputs(): ActionInputs {
  const branchesInput =
    log.getInput('BRANCHES') ||
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
    log.warning(
      `Failed to parse BRANCHES input: ${errorMessage}. Using default configuration.`,
    );
    branches = ['main', { name: 'next', prerelease: 'rc', channel: 'next' }];
  }
  const shouldCreateReleaseInput = log.getInput('CREATE_RELEASE') || 'true';
  const shouldCreateRelease = shouldCreateReleaseInput.toLowerCase() === 'true';
  const shouldPushTagsInput = log.getInput('PUSH_TAGS') || 'true';
  const pushTags = shouldPushTagsInput.toLowerCase() === 'true';
  const shouldAutoChangesetInput = log.getInput('AUTO_CHANGESET') || 'false';
  const autoChangeset = shouldAutoChangesetInput.toLowerCase() === 'true';
  return {
    githubToken: log.getInput('GITHUB_TOKEN', { required: true }),
    npmToken: log.getInput('NPM_TOKEN') || undefined,
    botName: log.getInput('BOT_NAME') || 'changesets-autopilot',
    branches,
    createRelease: shouldCreateRelease,
    pushTags,
    autoChangeset,
  };
}
