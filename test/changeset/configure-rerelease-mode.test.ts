import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('fs');
vi.mock('child_process');
vi.mock('@actions/core');

// Import mocked modules at the top level
const fs = await import('node:fs');
const child_process = await import('node:child_process');
const core = await import('@actions/core');
const { configureRereleaseMode } =
  await import('../../src/changeset/configure-rerelease-mode');

describe('configureRereleaseMode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be a function', () => {
    expect(typeof configureRereleaseMode).toBe('function');
  });

  it('enters prerelease mode if not already in prerelease mode', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const branchConfig = { name: 'main', prerelease: 'beta', isMatch: true };

    configureRereleaseMode(branchConfig);
    expect(core.info).toHaveBeenCalledWith(
      expect.stringContaining('Entering pre-release mode'),
    );
    expect(child_process.execSync).toHaveBeenCalledWith('npx changeset pre enter beta', {
      stdio: 'inherit',
    });
  });

  it('skips enter if already in prerelease mode', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    const branchConfig = { name: 'main', prerelease: 'beta', isMatch: true };

    configureRereleaseMode(branchConfig);
    expect(core.info).toHaveBeenCalledWith(
      'Already in pre-release mode, skipping enter.',
    );
    expect(child_process.execSync).not.toHaveBeenCalled();
  });

  it('exits prerelease mode if in prerelease mode', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    const branchConfig = { name: 'main', isMatch: true };

    configureRereleaseMode(branchConfig);
    expect(core.info).toHaveBeenCalledWith('Exiting pre-release mode');
    expect(child_process.execSync).toHaveBeenCalledWith('npx changeset pre exit', {
      stdio: 'inherit',
    });
  });

  it('skips exit if not in prerelease mode', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const branchConfig = { name: 'main', isMatch: true };

    configureRereleaseMode(branchConfig);
    expect(core.info).toHaveBeenCalledWith('Not in pre-release mode, skipping exit.');
    expect(child_process.execSync).not.toHaveBeenCalled();
  });
});
