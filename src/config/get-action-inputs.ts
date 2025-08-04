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
  return {
    githubToken: core.getInput('GITHUB_TOKEN', { required: true }),
    npmToken: core.getInput('NPM_TOKEN', { required: true }),
    botName: core.getInput('BOT_NAME') || 'changesets-autopilot',
    branches,
  };
}
