import type { ActionInputs, BranchConfig } from '../../types';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { parse } from 'yaml';
import { log } from '../utils/log';

const NEXT_BRANCH_CONFIG: BranchConfig = {
  name: 'next',
  prerelease: 'rc',
  channel: 'next',
};

function getFallbackBranches(): (string | BranchConfig)[] {
  return ['main', 'master', NEXT_BRANCH_CONFIG];
}

function getDefaultBranches(): (string | BranchConfig)[] {
  const changesetsConfigPath = path.join(process.cwd(), '.changeset', 'config.json');

  if (!existsSync(changesetsConfigPath)) {
    return getFallbackBranches();
  }

  try {
    const parsed = JSON.parse(readFileSync(changesetsConfigPath, 'utf8')) as {
      baseBranch?: unknown;
    };
    const baseBranch =
      typeof parsed.baseBranch === 'string' ? parsed.baseBranch.trim() : '';

    if (baseBranch.length === 0) {
      return getFallbackBranches();
    }

    if (baseBranch === NEXT_BRANCH_CONFIG.name) {
      return [NEXT_BRANCH_CONFIG];
    }

    return [baseBranch, NEXT_BRANCH_CONFIG];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.warning(
      `Failed to read .changeset/config.json: ${errorMessage}. Using fallback branch configuration.`,
    );
    return getFallbackBranches();
  }
}

export function getActionInputs(): ActionInputs {
  const branchesInput = log.getInput('BRANCHES');
  let branches: (string | BranchConfig)[];

  if (branchesInput.trim().length > 0) {
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
      branches = getDefaultBranches();
    }
  } else {
    branches = getDefaultBranches();
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
