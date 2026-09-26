import type { Package } from '../github/create-release';
import type { ReleasePackage } from './get-release-plan';
import { log } from './log';

type SummaryTableRow = Parameters<typeof log.summary.addTable>[0][number];

export interface JobSummaryInput {
  status: 'published' | 'skipped' | 'failed';
  reason?: string;
  branch?: string;
  distTag?: string;
  releasedPackages?: Package[];
  plannedPackages?: ReleasePackage[];
}

const HEADING_LEVEL = 2;

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/gu, (char) => HTML_ESCAPES[char] ?? char);
}

function code(value: string): string {
  return `<code>${escapeHtml(value)}</code>`;
}

function buildPackagesTable(
  releasedPackages: Package[],
  plannedPackages: ReleasePackage[],
): SummaryTableRow[] {
  const bumpByName = new Map(plannedPackages.map((pkg) => [pkg.name, pkg.type]));

  return [
    [
      { data: 'Package', header: true },
      { data: 'Version', header: true },
      { data: 'Bump', header: true },
    ],
    ...releasedPackages.map(({ packageJson }) => [
      code(packageJson.name),
      code(packageJson.version),
      bumpByName.get(packageJson.name) ?? '-',
    ]),
  ];
}

/**
 * Writes a job summary describing what was published, or why nothing was.
 * Never throws: a summary failure must not fail the release.
 */
export async function writeJobSummary(input: JobSummaryInput): Promise<void> {
  const {
    status,
    reason,
    branch,
    distTag,
    releasedPackages = [],
    plannedPackages = [],
  } = input;

  try {
    const { summary } = log;
    summary.addHeading('🦋 Changesets Autopilot', HEADING_LEVEL);
    const onBranch = branch === undefined ? '' : ` on ${code(branch)}`;

    if (status === 'published') {
      const branchText = branch === undefined ? '' : ` from ${code(branch)}`;
      const tagText = distTag === undefined ? '' : ` with dist-tag ${code(distTag)}`;
      summary
        .addRaw(
          `<p>✅ Published ${releasedPackages.length} package(s)${branchText}${tagText}.</p>`,
          true,
        )
        .addTable(buildPackagesTable(releasedPackages, plannedPackages));
    } else if (status === 'skipped') {
      summary
        .addRaw('<p>⏭️ Nothing was published.</p>', true)
        .addRaw(
          `<p><strong>Reason:</strong> ${escapeHtml(reason ?? 'Unknown')}</p>`,
          true,
        );
    } else {
      summary
        .addRaw(`<p>❌ Release failed${onBranch}.</p>`, true)
        .addCodeBlock(escapeHtml(reason ?? 'Unknown error'));

      if (releasedPackages.length > 0) {
        summary
          .addRaw('<p>Packages published before the failure:</p>', true)
          .addTable(buildPackagesTable(releasedPackages, plannedPackages));
      }
    }

    await summary.write();
  } catch (error) {
    log.warning(`Failed to write job summary: ${String(error)}`);
  }
}
