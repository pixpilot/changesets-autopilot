import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('fs');
vi.mock('child_process');
vi.mock('@actions/core');

const core = await import('@actions/core');
const { configurePrereleaseMode } = await import(
  '../../src/changeset/configure-prerelease-mode'
);

describe('configurePrereleaseMode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  test('should be a function', async () => {
    const { configurePrereleaseMode } = await import(
      '../../src/changeset/configure-prerelease-mode'
    );
    expect(typeof configurePrereleaseMode).toBe('function');
  });

  test('enters prerelease mode if not already in prerelease mode', async () => {
    const fs = await import('fs');
    const child_process = await import('child_process');

    vi.mocked(fs.existsSync).mockReturnValue(false);
    const branchConfig = { name: 'main', prerelease: 'beta', isMatch: true };

    configurePrereleaseMode(branchConfig);
    expect(core.info).toHaveBeenCalledWith(
      expect.stringContaining('Entering pre-release mode'),
    );
    expect(child_process.execSync).toHaveBeenCalledWith('npx changeset pre enter beta', {
      stdio: 'inherit',
    });
  });

  test('skips enter if already in prerelease mode', async () => {
    const fs = await import('fs');
    const child_process = await import('child_process');

    vi.mocked(fs.existsSync).mockReturnValue(true);
    const branchConfig = { name: 'main', prerelease: 'beta', isMatch: true };

    configurePrereleaseMode(branchConfig);
    expect(core.info).toHaveBeenCalledWith(
      'Already in pre-release mode, skipping enter.',
    );
    expect(child_process.execSync).not.toHaveBeenCalled();
  });

  test('exits prerelease mode if in prerelease mode', async () => {
    const fs = await import('fs');
    const child_process = await import('child_process');

    vi.mocked(fs.existsSync).mockReturnValue(true);
    const branchConfig = { name: 'main', isMatch: true };

    configurePrereleaseMode(branchConfig);
    expect(core.info).toHaveBeenCalledWith('Exiting pre-release mode');
    expect(child_process.execSync).toHaveBeenCalledWith('npx changeset pre exit', {
      stdio: 'inherit',
    });
  });

  test('skips exit if not in prerelease mode', async () => {
    const fs = await import('fs');
    const child_process = await import('child_process');

    vi.mocked(fs.existsSync).mockReturnValue(false);
    const branchConfig = { name: 'main', isMatch: true };

    configurePrereleaseMode(branchConfig);
    expect(core.info).toHaveBeenCalledWith('Not in pre-release mode, skipping exit.');
    expect(child_process.execSync).not.toHaveBeenCalled();
  });
});
