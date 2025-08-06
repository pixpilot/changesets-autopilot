import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as core from '@actions/core';
import type { SimpleGit } from 'simple-git';
import { pushChangesetTags } from '../../src/github/push-changeset-tags';

describe('pushChangesetTags', () => {
  const githubToken = 'test-token';
  const repo = 'owner/repo';
  let git: SimpleGit;

  beforeEach(() => {
    git = {
      pushTags: vi.fn().mockResolvedValue(undefined),
    } as unknown as SimpleGit;
    vi.spyOn(core, 'info').mockImplementation(() => {});
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
