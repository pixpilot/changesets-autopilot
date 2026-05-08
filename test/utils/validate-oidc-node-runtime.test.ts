import { describe, expect, it } from 'vitest';

import {
  isNodeVersionCompatibleForOidc,
  validateOidcNodeRuntime,
} from '../../src/utils/validate-oidc-node-runtime';

describe('validateOidcNodeRuntime', () => {
  it('accepts node version 24.0.0 and higher', () => {
    expect(isNodeVersionCompatibleForOidc('24.0.0')).toBe(true);
    expect(isNodeVersionCompatibleForOidc('25.0.0')).toBe(true);
  });

  it('rejects node versions lower than 24.0.0', () => {
    expect(isNodeVersionCompatibleForOidc('23.9.0')).toBe(false);
    expect(isNodeVersionCompatibleForOidc('22.14.0')).toBe(false);
    expect(isNodeVersionCompatibleForOidc('20.19.0')).toBe(false);
  });

  it('throws a clear error with required and current versions', () => {
    expect(() => validateOidcNodeRuntime('20.19.0')).toThrowError(
      /requires Node\.js 24\.0\.0\+/u,
    );
    expect(() => validateOidcNodeRuntime('20.19.0')).toThrowError(
      /Current Node\.js: 20\.19\.0/u,
    );
    expect(() => validateOidcNodeRuntime('20.19.0')).toThrowError(/ENEEDAUTH\/404/u);
  });
});
