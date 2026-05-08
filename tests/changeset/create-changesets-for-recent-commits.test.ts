import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createChangesetFile,
  createChangesetsForRecentCommits,
} from '../../src/changeset';
import { getChangesSinceLastCommit } from '../../src/git';

vi.mock('../../src/changeset/create-changeset-file', () => ({
  createChangesetFile: vi.fn(),
}));

vi.mock('@actions/core');

vi.mock('../../src/utils/commit-parser', () => ({
  getChangeTypeAndDescription: vi.fn((msg: string) => {
    if (msg === 'feat: add feature') {
      return { changeType: 'minor', description: 'add feature' };
    }
    if (msg === 'fix: bug fix') {
      return { changeType: 'patch', description: 'bug fix' };
    }
    if (msg === 'feat!: breaking change') {
      return { changeType: 'major', description: 'breaking change' };
    }
    return { changeType: 'none', description: msg };
  }),
}));

vi.mock('../../src/git/get-changes', () => ({
  getChangesSinceLastCommit: vi.fn(),
}));

describe('createChangesetsForRecentCommits', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Set up the mock return value in beforeEach
    vi.mocked(getChangesSinceLastCommit).mockResolvedValue({
      'pkg-a': {
        files: [],
        commits: [
          {
            message: 'feat: add feature',
            hash: '',
            date: '',
            refs: '',
            body: '',
            author_name: '',
            author_email: '',
          },
          {
            message: 'fix: bug fix',
            hash: '',
            date: '',
            refs: '',
            body: '',
            author_name: '',
            author_email: '',
          },
        ],
        version: '1.0.0',
        private: false,
      },
      'pkg-b': {
        files: [],
        commits: [
          {
            message: 'feat!: breaking change',
            hash: '',
            date: '',
            refs: '',
            body: '',
            author_name: '',
            author_email: '',
          },
        ],
        version: '1.0.0',
        private: false,
      },
    });
  });

  it('should be defined', () => {
    expect(createChangesetsForRecentCommits).toBeDefined();
  });

  it('should process changes and create changeset files for each commit', async () => {
    await createChangesetsForRecentCommits();

    expect(createChangesetFile).toHaveBeenCalledWith('pkg-a', 'minor', 'add feature');
    expect(createChangesetFile).toHaveBeenCalledWith('pkg-a', 'patch', 'bug fix');
    expect(createChangesetFile).toHaveBeenCalledWith('pkg-b', 'major', 'breaking change');
    expect(createChangesetFile).toHaveBeenCalledTimes(3);
  });
});
