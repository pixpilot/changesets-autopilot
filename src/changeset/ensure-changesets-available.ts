import { existsSync, readFileSync } from 'fs';
import path from 'path';

import * as core from '@actions/core';

const requiredPackages = ['@changesets/cli'];

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
    if (!existsSync(pkgJsonPath)) {
      throw new Error('package.json not found');
    }
    const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf8')) as PackageJson;
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
      throw new Error(
        `Package ${pkg} is not declared in package.json. Please add it to your dependencies or devDependencies.`,
      );
    }
  }
}

export function ensureChangesetsAvailable(): void {
  ensurePackagesAvailable(requiredPackages);
}
