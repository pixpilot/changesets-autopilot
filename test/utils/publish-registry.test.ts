import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getCustomPublishRegistries,
  getPackageRegistry,
  isCustomRegistry,
  NPM_REGISTRY,
} from '../../src/utils/publish-registry';

vi.mock('@manypkg/get-packages', () => ({
  getPackages: vi.fn(),
}));

const GITHUB_REGISTRY = 'https://npm.pkg.github.com';

describe('isCustomRegistry', () => {
  it.each([
    [undefined, false],
    ['', false],
    [NPM_REGISTRY, false],
    [`${NPM_REGISTRY}/`, false],
    ['https://registry.yarnpkg.com', false],
    ['https://registry.yarnpkg.com/', false],
    [GITHUB_REGISTRY, true],
    ['https://npm.internal.example.com', true],
  ])('returns %s -> %s', (registry, expected) => {
    expect(isCustomRegistry(registry)).toBe(expected);
  });
});

describe('getPackageRegistry', () => {
  beforeEach(() => {
    delete process.env.npm_config_registry;
    delete process.env['npm_config_@pixpilot-private:registry'];
  });

  it('falls back to npmjs when no publishConfig is present', () => {
    expect(getPackageRegistry({ name: 'pkg-a' })).toBe(NPM_REGISTRY);
  });

  it('reads publishConfig.registry', () => {
    expect(
      getPackageRegistry({
        name: '@pixpilot-private/billing-react',
        publishConfig: { registry: GITHUB_REGISTRY },
      }),
    ).toBe(GITHUB_REGISTRY);
  });

  it('prefers the scoped registry over publishConfig.registry', () => {
    expect(
      getPackageRegistry({
        name: '@pixpilot-private/billing-react',
        publishConfig: {
          '@pixpilot-private:registry': GITHUB_REGISTRY,
          registry: NPM_REGISTRY,
        },
      }),
    ).toBe(GITHUB_REGISTRY);
  });

  it('ignores the scoped registry for unscoped package names', () => {
    expect(
      getPackageRegistry({
        name: 'billing-react',
        publishConfig: { '@pixpilot-private:registry': GITHUB_REGISTRY },
      }),
    ).toBe(NPM_REGISTRY);
  });

  it('reads the scoped registry from the environment', () => {
    process.env['npm_config_@pixpilot-private:registry'] = GITHUB_REGISTRY;
    expect(getPackageRegistry({ name: '@pixpilot-private/billing' })).toBe(
      GITHUB_REGISTRY,
    );
  });

  it('normalises a yarn registry back to npmjs', () => {
    expect(
      getPackageRegistry({
        name: 'pkg-a',
        publishConfig: { registry: 'https://registry.yarnpkg.com' },
      }),
    ).toBe(NPM_REGISTRY);
  });
});

describe('getCustomPublishRegistries', () => {
  let mockGetPackages: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    delete process.env.npm_config_registry;
    const getPackagesModule = await import('@manypkg/get-packages');
    mockGetPackages = vi.mocked(getPackagesModule.getPackages);
  });

  it('returns an empty list when every package publishes to npmjs', async () => {
    mockGetPackages.mockResolvedValue({
      packages: [{ dir: '/packages/a', packageJson: { name: 'a', private: false } }],
    });

    await expect(getCustomPublishRegistries()).resolves.toEqual([]);
  });

  it('deduplicates custom registries and skips private packages', async () => {
    mockGetPackages.mockResolvedValue({
      packages: [
        {
          dir: '/packages/billing',
          packageJson: {
            name: '@pixpilot-private/billing',
            private: false,
            publishConfig: { registry: GITHUB_REGISTRY },
          },
        },
        {
          dir: '/packages/billing-react',
          packageJson: {
            name: '@pixpilot-private/billing-react',
            private: false,
            publishConfig: { registry: GITHUB_REGISTRY },
          },
        },
        {
          dir: '/tooling/eslint',
          packageJson: {
            name: '@internal/eslint-config',
            private: true,
            publishConfig: { registry: 'https://npm.internal.example.com' },
          },
        },
      ],
    });

    await expect(getCustomPublishRegistries()).resolves.toEqual([GITHUB_REGISTRY]);
  });
});
