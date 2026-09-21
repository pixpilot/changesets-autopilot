import { describe, expect, it } from 'vitest';

import { validatePublishAuth } from '../../src/utils/validate-publish-auth';

const GITHUB_REGISTRY = 'https://npm.pkg.github.com';

describe('validatePublishAuth', () => {
  it('allows token mode against a custom registry', () => {
    expect(() => validatePublishAuth(true, [GITHUB_REGISTRY])).not.toThrow();
  });

  it('allows OIDC mode when every package publishes to npmjs', () => {
    expect(() => validatePublishAuth(false, [])).not.toThrow();
  });

  it('rejects OIDC mode against a custom registry', () => {
    expect(() => validatePublishAuth(false, [GITHUB_REGISTRY])).toThrow(
      /OIDC trusted publisher mode is only supported by https:\/\/registry\.npmjs\.org/u,
    );
  });

  it('lists every offending registry', () => {
    expect(() =>
      validatePublishAuth(false, [GITHUB_REGISTRY, 'https://npm.internal.example.com']),
    ).toThrow(/https:\/\/npm\.pkg\.github\.com, https:\/\/npm\.internal\.example\.com/u);
  });
});
