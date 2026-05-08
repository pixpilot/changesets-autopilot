import process from 'node:process';

const MIN_OIDC_NODE_VERSION = '24.0.0';

interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
}

function parseVersion(version: string): ParsedVersion | undefined {
  const match = /^(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)/u.exec(version.trim());
  if (!match) {
    return undefined;
  }

  const { groups } = match;
  if (!groups) {
    return undefined;
  }

  return {
    major: Number(groups.major),
    minor: Number(groups.minor),
    patch: Number(groups.patch),
  };
}

function compareVersions(left: ParsedVersion, right: ParsedVersion): number {
  if (left.major !== right.major) {
    return left.major - right.major;
  }

  if (left.minor !== right.minor) {
    return left.minor - right.minor;
  }

  return left.patch - right.patch;
}

export function isNodeVersionCompatibleForOidc(
  nodeVersion: string,
  minimumVersion = MIN_OIDC_NODE_VERSION,
): boolean {
  const current = parseVersion(nodeVersion);
  const minimum = parseVersion(minimumVersion);

  if (!current || !minimum) {
    return false;
  }

  return compareVersions(current, minimum) >= 0;
}

export function validateOidcNodeRuntime(
  nodeVersion = process.versions.node,
  minimumVersion = MIN_OIDC_NODE_VERSION,
): void {
  if (isNodeVersionCompatibleForOidc(nodeVersion, minimumVersion)) {
    return;
  }

  throw new Error(
    `OIDC trusted publisher mode requires Node.js ${minimumVersion}+ (npm 11.5.1+). Current Node.js: ${nodeVersion}. Reason: npm trusted publishing OIDC token exchange is not supported reliably on older Node/npm runtimes and can fail with ENEEDAUTH/404. Fix: use actions/setup-node@v6 with node-version: 24 or higher. If your workflow already sets Node 24+ but this still reports Node 20.x, update to an action version that runs with node24 in action.yml (or pin to the latest commit that includes it).`,
  );
}
