import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('child_process');
vi.mock('@actions/core');

const child_process = await import('child_process');
const core = await import('@actions/core');
const { runChangesetVersion } = await import('../../src/changeset/run-changeset-version');

describe('runChangesetVersion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('calls execSync with correct command and env', () => {
    const execSyncMock = child_process.execSync as unknown as ReturnType<typeof vi.fn>;
    execSyncMock.mockReturnValue('Versioned!');
    runChangesetVersion('gh-token');
    expect(child_process.execSync).toHaveBeenCalledWith('npx changeset version', {
      encoding: 'utf8',
      cwd: process.cwd(),
      env: expect.objectContaining({
        GITHUB_TOKEN: 'gh-token',
      }),
    });
    expect(core.info).toHaveBeenCalledWith('Versioned!');
    expect(core.info).toHaveBeenCalledWith('Changeset version completed successfully');
  });

  test('logs error message if execSync throws', () => {
    const execSyncMock = child_process.execSync as unknown as ReturnType<typeof vi.fn>;
    execSyncMock.mockImplementation(() => {
      throw new Error('fail!');
    });
    runChangesetVersion('gh-token');
    expect(core.info).toHaveBeenCalledWith('Error message: fail!');
  });
});
