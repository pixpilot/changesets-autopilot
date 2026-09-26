import type { Package } from '../github/create-release';
import type { ReleasePackage } from './get-release-plan';
import { log } from './log';
import { writeJobSummary } from './write-job-summary';

export interface ReleaseResult {
  status: 'published' | 'skipped' | 'failed';
  reason?: string;
  branch?: string;
  distTag?: string;
  releasedPackages?: Package[];
  plannedPackages?: ReleasePackage[];
}

function formatPackageLines(
  releasedPackages: Package[],
  plannedPackages: ReleasePackage[],
): string[] {
  const bumpByName = new Map(plannedPackages.map((pkg) => [pkg.name, pkg.type]));

  return releasedPackages.map(({ packageJson }) => {
    const bump = bumpByName.get(packageJson.name);
    const bumpText = bump === undefined ? '' : ` (${bump})`;
    return `- ${packageJson.name}@${packageJson.version}${bumpText}`;
  });
}

/**
 * Formats the release outcome as plain text for notifications: the published
 * packages, why nothing was published, or why the release failed.
 */
export function formatReleaseSummary(result: ReleaseResult): string {
  const { status, reason, distTag, releasedPackages = [], plannedPackages = [] } = result;
  const packageLines = formatPackageLines(releasedPackages, plannedPackages);

  if (status === 'published') {
    const tagText = distTag === undefined ? '' : ` (dist-tag: ${distTag})`;
    return [
      `Published ${releasedPackages.length} package(s)${tagText}:`,
      ...packageLines,
    ].join('\n');
  }

  if (status === 'skipped') {
    return `Nothing published: ${reason ?? 'Unknown'}`;
  }

  // Publish errors carry the full command output; the first line is the cause.
  const firstLine = (reason ?? '').split('\n')[0] ?? '';
  const lines = [`Release failed: ${firstLine.length > 0 ? firstLine : 'Unknown error'}`];
  if (packageLines.length > 0) {
    lines.push('Published before the failure:', ...packageLines);
  }
  return lines.join('\n');
}

/**
 * Exposes the release outcome as action outputs and writes the job summary.
 */
export async function reportReleaseResult(result: ReleaseResult): Promise<void> {
  const released = (result.releasedPackages ?? []).map(({ packageJson }) => ({
    name: packageJson.name,
    version: packageJson.version,
  }));

  log.setOutput('published-packages', JSON.stringify(released));
  log.setOutput(
    'published-versions',
    released.map(({ name, version }) => `${name}@${version}`).join(', '),
  );
  log.setOutput('release-summary', formatReleaseSummary(result));

  await writeJobSummary(result);
}
