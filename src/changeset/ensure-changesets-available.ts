import { execSync } from 'child_process';

import * as core from '@actions/core';

const requiredPackages = ['@changesets/changelog-github', '@changesets/cli'];

/**
 * Checks if a package is installed locally by attempting require.resolve
 */
function isPackageInstalledLocally(pkgName: string): boolean {
  try {
    require.resolve(pkgName, { paths: [process.cwd()] });
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if a package is installed globally by parsing `npm list -g --json`
 */
function isPackageInstalledGlobally(pkgName: string): boolean {
  try {
    const npmListOutput = execSync('npm list -g --json', { encoding: 'utf8' });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const parsed = JSON.parse(npmListOutput);
    // npm global packages are under dependencies
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return parsed.dependencies && pkgName in parsed.dependencies;
  } catch (error) {
    core.warning(`Failed to check global npm packages: ${(error as Error).message}`);
    return false;
  }
}

/**
 * Ensures that required packages are installed locally or globally, installs globally if missing
 */
export function ensurePackagesAvailable(packages: string[]): void {
  for (const pkg of packages) {
    const localInstalled = isPackageInstalledLocally(pkg);
    const globalInstalled = !localInstalled && isPackageInstalledGlobally(pkg);

    if (!localInstalled && !globalInstalled) {
      core.info(
        `${pkg} is not installed locally or globally. Installing globally as fallback...`,
      );
      execSync(`npm install -g ${pkg}`, { stdio: 'inherit' });
    } else {
      core.info(`${pkg} is installed ${localInstalled ? 'locally' : 'globally'}.`);
    }
  }
}

export function ensureChangesetsAvailable(): void {
  ensurePackagesAvailable(requiredPackages);
}
