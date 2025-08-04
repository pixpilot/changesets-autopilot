import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import * as core from '@actions/core';

const requiredPackages = ['@changesets/changelog-github', '@changesets/cli'];

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  name?: string;
}

/**
 * Checks if a package exists in dependencies or devDependencies of package.json
 */
function isPackageDeclared(pkgName: string): boolean {
  try {
    const pkgJsonPath = path.join(process.cwd(), 'package.json');
    core.debug(`Checking for package.json at ${pkgJsonPath}`);
    if (!fs.existsSync(pkgJsonPath)) {
      core.warning('package.json not found');
      return false;
    }
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8')) as PackageJson;
    const deps = pkgJson.dependencies ?? {};
    const devDeps = pkgJson.devDependencies ?? {};
    return pkgName in deps || pkgName in devDeps;
  } catch (err) {
    core.warning(`Failed to read package.json: ${(err as Error).message}`);
    return false;
  }
}

/**
 * Ensures that required packages are declared in package.json or globally installed as fallback
 */
export function ensurePackagesAvailable(packages: string[]): void {
  for (const pkg of packages) {
    if (!isPackageDeclared(pkg)) {
      core.info(`${pkg} not found in package.json, installing globally as fallback...`);
      execSync(`npm install -g ${pkg}`, { stdio: 'inherit' });
    } else {
      core.info(`${pkg} is declared in package.json`);
    }
  }
}

export function ensureChangesetsAvailable(): void {
  ensurePackagesAvailable(requiredPackages);
}
