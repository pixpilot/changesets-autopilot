import { describe, it, expect } from 'vitest';
import { getReleaseCommitMessage } from '../../src/utils/get-release-commit-message';
import { DEFAULT_RELEASE_COMMIT_MESSAGE } from '../../src/constants/release-commit-message';

describe('getReleaseCommitMessage', () => {
  it('returns correct message for single package', () => {
    const packages = [{ name: 'pkg-a', version: '1.2.3', type: 'minor' as const }];
    const msg = getReleaseCommitMessage(packages);
    expect(msg).toBe('chore(release): 1.2.3 [skip ci]');
  });

  it('returns correct message for multiple packages', () => {
    const packages = [
      { name: 'package1', version: '1.0.3', type: 'minor' as const },
      { name: 'package2', version: '1.0.4', type: 'patch' as const },
    ];
    const msg = getReleaseCommitMessage(packages);
    expect(msg).toBe(
      `${DEFAULT_RELEASE_COMMIT_MESSAGE}\n\npackage1@1.0.3\npackage2@1.0.4`,
    );
  });

  it('returns default message for no packages', () => {
    const msg = getReleaseCommitMessage([]);
    expect(msg).toBe(DEFAULT_RELEASE_COMMIT_MESSAGE);
  });

  it('handles errors gracefully', () => {
    // Simulate error by passing malformed input
    // @ts-expect-error
    const msg = getReleaseCommitMessage(null);
    expect(msg).toBe(DEFAULT_RELEASE_COMMIT_MESSAGE);
  });

  it('returns correct message for only changed packages in monorepo', () => {
    const packages = [
      { name: 'package1', version: '1.0.3', type: 'minor' as const },
      { name: 'package3', version: '1.0.5', type: 'patch' as const },
    ];
    const msg = getReleaseCommitMessage(packages);
    expect(msg).toBe(
      `${DEFAULT_RELEASE_COMMIT_MESSAGE}\n\npackage1@1.0.3\npackage3@1.0.5`,
    );
  });
});
