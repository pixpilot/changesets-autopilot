import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let execSyncMock: any;
let infoMock: any;

// Use doMock to scope mocks to this file and avoid global pollution
const mockChildProcess = () => {
  execSyncMock = vi.fn();
  vi.doMock('child_process', () => ({
    execSync: execSyncMock,
  }));
};

const mockActionsCore = () => {
  infoMock = vi.fn();
  vi.doMock('@actions/core', () => ({
    info: infoMock,
  }));
};

describe('ensureChangesetsAvailable', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockChildProcess();
    mockActionsCore();
  });
  afterEach(() => {
    vi.unmock('child_process');
    vi.unmock('@actions/core');
  });

  it('should log when changesets CLI is available', async () => {
    const { ensureChangesetsAvailable } = await import(
      '../../src/changeset/ensure-changesets-available'
    );
    execSyncMock.mockReset();
    infoMock.mockReset();
    execSyncMock.mockImplementationOnce(() => '2.0.0');
    ensureChangesetsAvailable();
    expect(execSyncMock).toHaveBeenCalledWith(
      'npx changeset --version',
      expect.objectContaining({ stdio: 'pipe' }),
    );
    expect(infoMock).toHaveBeenCalledWith('Changesets CLI is available');
  });

  it('should install changesets CLI if not available', async () => {
    const { ensureChangesetsAvailable } = await import(
      '../../src/changeset/ensure-changesets-available'
    );
    execSyncMock.mockReset();
    infoMock.mockReset();

    // 1. Mock the first call to fail and the second to succeed
    execSyncMock
      .mockImplementationOnce(() => {
        throw new Error('not found');
      })
      .mockImplementationOnce(() => {
        // This simulates the 'npm install' command succeeding
        return 'Success';
      });

    ensureChangesetsAvailable();

    // 2. Assert that both calls happened in the correct order
    expect(execSyncMock).toHaveBeenCalledTimes(2);

    // Assert the first call (the version check)
    expect(execSyncMock).toHaveBeenNthCalledWith(
      1, // First call
      'npx changeset --version',
      expect.objectContaining({ stdio: 'pipe' }),
    );

    // Assert the log message
    expect(infoMock).toHaveBeenCalledWith(
      'Changesets CLI not found, installing globally as fallback...',
    );

    // Assert the second call (the installation)
    expect(execSyncMock).toHaveBeenNthCalledWith(
      2, // Second call
      'npm install -g @changesets/cli',
      expect.objectContaining({ stdio: 'inherit' }),
    );
  });
});
