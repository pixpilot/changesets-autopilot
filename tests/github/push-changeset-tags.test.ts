import type { SimpleGit } from 'simple-git';
import * as core from '@actions/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pushChangesetTags } from '../../src/github/push-changeset-tags';

vi.mock('@actions/core', () => ({
  info: vi.fn(),
}));

describe('pushChangesetTags', () => {
  const githubToken = 'test-token';
  const repo = 'owner/repo';
  let git: SimpleGit;

  beforeEach(() => {
    git = {
      pushTags: vi.fn().mockResolvedValue(undefined),
    } as unknown as SimpleGit;
    vi.mocked(core.info).mockImplementation(() => {});
  });

  it('pushes tags to GitHub and logs info', async () => {
    await pushChangesetTags(git, githubToken, repo);
    expect(git.pushTags).toHaveBeenCalledWith(
      `https://${githubToken}@github.com/${repo}.git`,
    );
    expect(core.info).toHaveBeenCalledWith(
      'Pushing tags created by changeset publish to GitHub...',
    );
    expect(core.info).toHaveBeenCalledWith('Tags pushed successfully');
  });
});
