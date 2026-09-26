import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockSetOutput, mockWriteJobSummary } = vi.hoisted(() => ({
  mockSetOutput: vi.fn(),
  mockWriteJobSummary: vi.fn(),
}));

vi.mock('@actions/core', () => ({ setOutput: mockSetOutput }));
vi.mock('../../src/utils/write-job-summary', () => ({
  writeJobSummary: mockWriteJobSummary,
}));

const { formatReleaseSummary, reportReleaseResult } =
  await import('../../src/utils/release-result');

const packageA = {
  dir: '/repo/packages/a',
  packageJson: { name: '@scope/a', version: '1.2.0' },
};
const packageB = {
  dir: '/repo/packages/b',
  packageJson: { name: '@scope/b', version: '2.0.0' },
};

describe('formatReleaseSummary', () => {
  it('lists published packages with dist-tag and bump type', () => {
    expect(
      formatReleaseSummary({
        status: 'published',
        distTag: 'latest',
        releasedPackages: [packageA, packageB],
        plannedPackages: [{ name: '@scope/a', version: '1.2.0', type: 'minor' }],
      }),
    ).toBe(
      'Published 2 package(s) (dist-tag: latest):\n- @scope/a@1.2.0 (minor)\n- @scope/b@2.0.0',
    );
  });

  it('gives the reason when nothing was published', () => {
    expect(
      formatReleaseSummary({ status: 'skipped', reason: 'No changesets found.' }),
    ).toBe('Nothing published: No changesets found.');
  });

  it('keeps only the first line of a failure reason', () => {
    expect(
      formatReleaseSummary({
        status: 'failed',
        reason: 'Publishing failed in token mode.\nnpm ERR! 403 Forbidden',
      }),
    ).toBe('Release failed: Publishing failed in token mode.');
  });

  it('lists packages published before a failure', () => {
    expect(
      formatReleaseSummary({
        status: 'failed',
        reason: 'tag error',
        releasedPackages: [packageA],
      }),
    ).toBe('Release failed: tag error\nPublished before the failure:\n- @scope/a@1.2.0');
  });

  it('falls back when the failure reason is empty', () => {
    expect(formatReleaseSummary({ status: 'failed', reason: '' })).toBe(
      'Release failed: Unknown error',
    );
  });
});

describe('reportReleaseResult', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWriteJobSummary.mockResolvedValue(undefined);
  });

  it('sets package outputs and writes the job summary', async () => {
    const result = {
      status: 'published' as const,
      releasedPackages: [packageA, packageB],
    };

    await reportReleaseResult(result);

    expect(mockSetOutput).toHaveBeenCalledWith(
      'published-packages',
      '[{"name":"@scope/a","version":"1.2.0"},{"name":"@scope/b","version":"2.0.0"}]',
    );
    expect(mockSetOutput).toHaveBeenCalledWith(
      'published-versions',
      '@scope/a@1.2.0, @scope/b@2.0.0',
    );
    expect(mockSetOutput).toHaveBeenCalledWith(
      'release-summary',
      'Published 2 package(s):\n- @scope/a@1.2.0\n- @scope/b@2.0.0',
    );
    expect(mockWriteJobSummary).toHaveBeenCalledWith(result);
  });

  it('sets empty package outputs when nothing was published', async () => {
    await reportReleaseResult({ status: 'skipped', reason: 'nothing to do' });

    expect(mockSetOutput).toHaveBeenCalledWith('published-packages', '[]');
    expect(mockSetOutput).toHaveBeenCalledWith('published-versions', '');
    expect(mockSetOutput).toHaveBeenCalledWith(
      'release-summary',
      'Nothing published: nothing to do',
    );
  });
});
