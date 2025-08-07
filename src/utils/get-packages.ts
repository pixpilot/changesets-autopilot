// Utility to extract selected package info and monorepo status
import type { Package } from '@manypkg/get-packages';
import { getPackages as manypkg } from '@manypkg/get-packages';

export interface PackageSelection {
  name: string;
  version: string;
  private: boolean;
}

export interface SelectionResult {
  packages: Package[];
  privatePackages: Package[];
  publishablePackages: Package[];
  isMonorepo: boolean;
}

export async function getPackages(cwd: string = process.cwd()): Promise<SelectionResult> {
  const { packages } = await manypkg(cwd);

  // For single-package repos (GitHub Actions, etc.), we still want to process the root package
  // even if it's marked as private, since that's the package we want to version
  const isSinglePackageRepo = packages.length === 1 && packages[0].relativeDir === '.';

  // Filter out private packages, but keep the root package for single-package repos
  const publishablePackages = packages.filter(
    (pkg) => !pkg.packageJson.private || (isSinglePackageRepo && pkg.relativeDir === '.'),
  );
  const privatePackages = packages.filter(
    (pkg) => pkg.packageJson.private && !(isSinglePackageRepo && pkg.relativeDir === '.'),
  );

  return {
    packages,
    privatePackages,

    isMonorepo: !isSinglePackageRepo,
    publishablePackages,
  };
}
