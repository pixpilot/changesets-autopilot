import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('child_process');
vi.mock('@actions/core');

const child_process = await import('node:child_process');
const core = await import('@actions/core');
const { runChangesetVersion } = await import('../../src/changeset/run-changeset-version');

describe('runChangesetVersion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls execSync with correct command and env', () => {
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

  it('logs error message if execSync throws', () => {
    const execSyncMock = child_process.execSync as unknown as ReturnType<typeof vi.fn>;
    execSyncMock.mockImplementation(() => {
      throw new Error('fail!');
    });
    runChangesetVersion('gh-token');
    expect(core.info).toHaveBeenCalledWith('Error message: fail!');
  });
});
