import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as core from '@actions/core';
import getReleasePlan from '@changesets/get-release-plan';
import { getPackagesToRelease } from '../../src/utils/get-release-plan';

vi.mock('@actions/core');
vi.mock('@changesets/get-release-plan');

describe('getPackagesToRelease', () => {
  const mockReleasePlan = {
    releases: [
      { name: 'pkg-a', newVersion: '1.2.0', type: 'minor' },
      { name: 'pkg-b', newVersion: '2.0.0', type: 'major' },
      { name: 'pkg-c', newVersion: '1.0.1', type: 'patch' },
      { name: 'pkg-d', newVersion: '1.0.0', type: 'none' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getReleasePlan as any).mockResolvedValue(mockReleasePlan);
  });

  it("returns only packages with type not 'none'", async () => {
    const result = await getPackagesToRelease();
    expect(result).toEqual([
      { name: 'pkg-a', version: '1.2.0', type: 'minor' },
      { name: 'pkg-b', version: '2.0.0', type: 'major' },
      { name: 'pkg-c', version: '1.0.1', type: 'patch' },
    ]);
    expect(core.info).toHaveBeenCalledWith('  - pkg-a@1.2.0 (minor)');
    expect(core.info).toHaveBeenCalledWith('  - pkg-b@2.0.0 (major)');
    expect(core.info).toHaveBeenCalledWith('  - pkg-c@1.0.1 (patch)');
    expect(core.info).not.toHaveBeenCalledWith('  - pkg-d@1.0.0 (none)');
  });

  it('returns empty array and warns on error', async () => {
    (getReleasePlan as any).mockRejectedValue(new Error('fail'));
    const result = await getPackagesToRelease();
    expect(result).toEqual([]);
    expect(core.warning).toHaveBeenCalledWith(
      expect.stringContaining('Failed to get release plan: Error: fail'),
    );
  });
});
