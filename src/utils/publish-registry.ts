import process from 'node:process';

import { getPackages } from '@manypkg/get-packages';

export const NPM_REGISTRY = 'https://registry.npmjs.org';
const YARN_REGISTRY = 'https://registry.yarnpkg.com';

interface RegistryPackageJson {
  name?: string;
  private?: boolean;
  publishConfig?: Record<string, unknown>;
}

/**
 * Mirrors `@changesets/cli`'s own registry resolution so the action reasons about
 * the exact registry changesets will publish to.
 */
export function isCustomRegistry(registry?: string): boolean {
  if (typeof registry !== 'string' || registry.length === 0) {
    return false;
  }

  return (
    registry !== NPM_REGISTRY &&
    registry !== `${NPM_REGISTRY}/` &&
    registry !== YARN_REGISTRY &&
    registry !== `${YARN_REGISTRY}/`
  );
}

function readRegistry(
  publishConfig: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = publishConfig[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/**
 * Resolves the registry a single package will be published to, honouring
 * `publishConfig["@scope:registry"]` before `publishConfig.registry`.
 */
export function getPackageRegistry(packageJson: RegistryPackageJson): string {
  const publishConfig = packageJson.publishConfig ?? {};
  const { name } = packageJson;

  if (typeof name === 'string' && name.startsWith('@')) {
    const scope = name.split('/')[0];
    const scopedRegistry =
      readRegistry(publishConfig, `${scope}:registry`) ??
      process.env[`npm_config_${scope}:registry`];

    if (typeof scopedRegistry === 'string' && scopedRegistry.length > 0) {
      return scopedRegistry;
    }
  }

  const registry =
    readRegistry(publishConfig, 'registry') ?? process.env.npm_config_registry;

  return isCustomRegistry(registry) ? (registry as string) : NPM_REGISTRY;
}

/**
 * Returns the distinct non-npmjs registries publishable workspace packages target
 * (e.g. `https://npm.pkg.github.com`). Empty when everything goes to npmjs.
 */
export async function getCustomPublishRegistries(
  cwd: string = process.cwd(),
): Promise<string[]> {
  const { packages } = await getPackages(cwd);
  const registries = new Set<string>();

  for (const pkg of packages) {
    const packageJson = pkg.packageJson as RegistryPackageJson;
    if (packageJson.private !== true) {
      const registry = getPackageRegistry(packageJson);
      if (isCustomRegistry(registry)) {
        registries.add(registry);
      }
    }
  }

  return [...registries];
}
