import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockSummary, mockWarning } = vi.hoisted(() => {
  const summary = {
    addHeading: vi.fn(),
    addRaw: vi.fn(),
    addTable: vi.fn(),
    addCodeBlock: vi.fn(),
    write: vi.fn(),
  };
  return { mockSummary: summary, mockWarning: vi.fn() };
});

vi.mock('@actions/core', () => ({ summary: mockSummary, warning: mockWarning }));

const { writeJobSummary } = await import('../../src/utils/write-job-summary');

const releasedPackage = {
  dir: '/repo/packages/a',
  packageJson: { name: '@scope/a', version: '2.0.0' },
};

function rawCalls(): string[] {
  return mockSummary.addRaw.mock.calls.map(([text]) => String(text));
}

describe('writeJobSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const method of ['addHeading', 'addRaw', 'addTable', 'addCodeBlock'] as const) {
      mockSummary[method].mockReturnValue(mockSummary);
    }
    mockSummary.write.mockResolvedValue(mockSummary);
  });

  it('writes a table of published packages with their bump type', async () => {
    await writeJobSummary({
      status: 'published',
      branch: 'main',
      distTag: 'latest',
      releasedPackages: [releasedPackage],
      plannedPackages: [{ name: '@scope/a', version: '2.0.0', type: 'major' }],
    });

    expect(mockSummary.addHeading).toHaveBeenCalledWith('🦋 Changesets Autopilot', 2);
    expect(rawCalls()[0]).toBe(
      '<p>✅ Published 1 package(s) from <code>main</code> with dist-tag <code>latest</code>.</p>',
    );
    expect(mockSummary.addTable).toHaveBeenCalledWith([
      [
        { data: 'Package', header: true },
        { data: 'Version', header: true },
        { data: 'Bump', header: true },
      ],
      ['<code>@scope/a</code>', '<code>2.0.0</code>', 'major'],
    ]);
    expect(mockSummary.write).toHaveBeenCalled();
  });

  it('falls back to "-" when the bump type is unknown', async () => {
    await writeJobSummary({ status: 'published', releasedPackages: [releasedPackage] });

    expect(rawCalls()[0]).toBe('<p>✅ Published 1 package(s).</p>');
    expect(mockSummary.addTable.mock.calls[0]?.[0][1]).toEqual([
      '<code>@scope/a</code>',
      '<code>2.0.0</code>',
      '-',
    ]);
  });

  it('writes the escaped reason when nothing was published', async () => {
    await writeJobSummary({
      status: 'skipped',
      reason: "Branch 'x' is not <configured>.",
    });

    expect(rawCalls()).toEqual([
      '<p>⏭️ Nothing was published.</p>',
      '<p><strong>Reason:</strong> Branch &#39;x&#39; is not &lt;configured&gt;.</p>',
    ]);
    expect(mockSummary.addTable).not.toHaveBeenCalled();
  });

  it('writes an escaped error and packages published before the failure', async () => {
    await writeJobSummary({
      status: 'failed',
      reason: 'push failed: <remote> rejected',
      branch: 'main',
      releasedPackages: [releasedPackage],
    });

    expect(rawCalls()[0]).toBe('<p>❌ Release failed on <code>main</code>.</p>');
    expect(mockSummary.addCodeBlock).toHaveBeenCalledWith(
      'push failed: &lt;remote&gt; rejected',
    );
    expect(mockSummary.addTable).toHaveBeenCalledTimes(1);
  });

  it('omits the package table on failure when nothing was published', async () => {
    await writeJobSummary({ status: 'failed', reason: 'boom' });

    expect(rawCalls()).toEqual(['<p>❌ Release failed.</p>']);
    expect(mockSummary.addTable).not.toHaveBeenCalled();
  });

  it('warns instead of throwing when the summary cannot be written', async () => {
    mockSummary.write.mockRejectedValue(new Error('no GITHUB_STEP_SUMMARY'));

    await expect(
      writeJobSummary({ status: 'skipped', reason: 'nothing' }),
    ).resolves.toBeUndefined();

    expect(mockWarning).toHaveBeenCalledWith(
      'Failed to write job summary: Error: no GITHUB_STEP_SUMMARY',
    );
  });
});
