import { describe, test, expect, vi, beforeEach } from 'vitest';

import { createChangesetFile, processChanges } from '../../src/changeset';
import { getChangesSinceLastCommit } from '../../src/git';

vi.mock('../../src/changeset/create-changeset-file', () => ({
  createChangesetFile: vi.fn(),
}));

vi.mock('@actions/core');

vi.mock('../../src/utils/get-change-type-and-description', () => ({
  getChangeTypeAndDescription: vi.fn((msg: string) => {
    if (msg === 'feat: add feature')
      return Promise.resolve({ changeType: 'minor', description: 'add feature' });
    if (msg === 'fix: bug fix')
      return Promise.resolve({ changeType: 'patch', description: 'bug fix' });
    if (msg === 'feat!: breaking change')
      return Promise.resolve({ changeType: 'major', description: 'breaking change' });
    return Promise.resolve({ changeType: 'none', description: msg });
  }),
}));

vi.mock('../../src/git/get-changes', () => ({
  getChangesSinceLastCommit: vi.fn(),
}));

describe('processChanges', () => {
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

  test('should be defined', () => {
    expect(processChanges).toBeDefined();
  });

  test('should process changes and create changeset files for each commit', async () => {
    await processChanges();

    expect(createChangesetFile).toHaveBeenCalledWith('pkg-a', 'minor', 'add feature');
    expect(createChangesetFile).toHaveBeenCalledWith('pkg-a', 'patch', 'bug fix');
    expect(createChangesetFile).toHaveBeenCalledWith('pkg-b', 'major', 'breaking change');
    expect(createChangesetFile).toHaveBeenCalledTimes(3);
  });
});
