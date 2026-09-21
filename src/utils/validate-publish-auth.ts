import { NPM_REGISTRY } from './publish-registry';

/**
 * npm Trusted Publisher (OIDC) token exchange only exists on the public npm
 * registry. Any package pinned to another registry through
 * `publishConfig.registry` must authenticate with a token instead.
 */
export function validatePublishAuth(
  hasNpmToken: boolean,
  customRegistries: string[],
): void {
  if (hasNpmToken || customRegistries.length === 0) {
    return;
  }

  throw new Error(
    `OIDC trusted publisher mode is only supported by ${NPM_REGISTRY}, but publishable packages target: ${customRegistries.join(', ')}. Fix: pass a REGISTRY_TOKEN for that registry. For GitHub Packages (https://npm.pkg.github.com) use REGISTRY_TOKEN: \${{ secrets.GITHUB_TOKEN }} together with permissions.packages: write, and set registry-url: 'https://npm.pkg.github.com' on actions/setup-node.`,
  );
}
