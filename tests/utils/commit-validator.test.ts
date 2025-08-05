import { describe, it, expect } from 'vitest';
import { isVersionOrReleaseCommit } from '../../src/utils/commit-validator';

describe('isVersionOrReleaseCommit', () => {
  describe('single package release pattern', () => {
    it('should return true for valid single package release commit', () => {
      expect(isVersionOrReleaseCommit('chore(release): 1.2.3 [skip ci]')).toBe(true);
      expect(isVersionOrReleaseCommit('chore(release): pack@1.2.3 [skip ci]')).toBe(true);
      // Scoped package
      expect(
        isVersionOrReleaseCommit('chore(release): @scope/pack@1.2.3 [skip ci]'),
      ).toBe(true);
      expect(
        isVersionOrReleaseCommit('chore(release): @scope/pack@1.2.3-beta.1 [skip ci]'),
      ).toBe(true);
    });

    it('should return true for version with prerelease', () => {
      expect(isVersionOrReleaseCommit('chore(release): 1.2.3-alpha [skip ci]')).toBe(
        true,
      );
      expect(isVersionOrReleaseCommit('chore(release): 1.2.3-beta.1 [skip ci]')).toBe(
        true,
      );
      expect(isVersionOrReleaseCommit('chore(release): 1.2.3-rc.2 [skip ci]')).toBe(true);
      // Scoped package with prerelease
      expect(
        isVersionOrReleaseCommit('chore(release): @scope/pack@1.2.3-alpha [skip ci]'),
      ).toBe(true);
      expect(
        isVersionOrReleaseCommit('chore(release): @scope/pack@1.2.3-rc.2 [skip ci]'),
      ).toBe(true);
    });

    it('should handle extra whitespace', () => {
      expect(isVersionOrReleaseCommit('  chore(release): 1.2.3 [skip ci]  ')).toBe(true);
      expect(isVersionOrReleaseCommit('chore(release):  1.2.3  [skip ci]')).toBe(true);
      // Scoped package with whitespace
      expect(
        isVersionOrReleaseCommit('  chore(release): @scope/pack@1.2.3 [skip ci]  '),
      ).toBe(true);
      expect(
        isVersionOrReleaseCommit('chore(release):  @scope/pack@1.2.3  [skip ci]'),
      ).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(isVersionOrReleaseCommit('CHORE(RELEASE): 1.2.3 [SKIP CI]')).toBe(true);
      expect(isVersionOrReleaseCommit('Chore(Release): 1.2.3 [Skip Ci]')).toBe(true);
      // Scoped package case insensitivity
      expect(
        isVersionOrReleaseCommit('CHORE(RELEASE): @SCOPE/PACK@1.2.3 [SKIP CI]'),
      ).toBe(true);
      expect(
        isVersionOrReleaseCommit('Chore(Release): @scope/pack@1.2.3 [Skip Ci]'),
      ).toBe(true);
    });

    it('should return false for invalid single package patterns', () => {
      expect(isVersionOrReleaseCommit('chore(release): 1.2.3')).toBe(false); // missing [skip ci]
      expect(isVersionOrReleaseCommit('chore(release): v1.2.3 [skip ci]')).toBe(false); // has 'v' prefix
      expect(isVersionOrReleaseCommit('chore(release): 1.2 [skip ci]')).toBe(false); // invalid semver
      expect(isVersionOrReleaseCommit('feat(release): 1.2.3 [skip ci]')).toBe(false); // wrong type
      // Scoped package invalid
      expect(isVersionOrReleaseCommit('chore(release): @scope/pack@1.2.3')).toBe(false); // missing [skip ci]
      expect(
        isVersionOrReleaseCommit('chore(release): @scope/pack@v1.2.3 [skip ci]'),
      ).toBe(false); // has 'v' prefix
      expect(isVersionOrReleaseCommit('chore(release): @scope/pack@1.2 [skip ci]')).toBe(
        false,
      ); // invalid semver
      expect(isVersionOrReleaseCommit('feat(release): @scope/pack@1.2.3 [skip ci]')).toBe(
        false,
      ); // wrong type
    });
  });

  describe('multi-package release pattern', () => {
    it('should return true for valid multi-package release commit', () => {
      expect(
        isVersionOrReleaseCommit('chore(release): bump package versions [skip ci]'),
      ).toBe(true);
    });

    it('should handle extra whitespace', () => {
      expect(
        isVersionOrReleaseCommit('  chore(release): bump package versions [skip ci]  '),
      ).toBe(true);
    });

    it('should return false for similar but incorrect messages', () => {
      expect(isVersionOrReleaseCommit('chore(release): bump package versions')).toBe(
        false,
      ); // missing [skip ci]
      expect(
        isVersionOrReleaseCommit('chore(release): bump packages versions [skip ci]'),
      ).toBe(false); // wrong wording
      expect(
        isVersionOrReleaseCommit('feat(release): bump package versions [skip ci]'),
      ).toBe(false); // wrong type
    });
  });

  describe('legacy pattern', () => {
    it('should return true for legacy version packages commit', () => {
      expect(isVersionOrReleaseCommit('chore(release): version packages [skip ci]')).toBe(
        true,
      );
    });

    it('should handle extra whitespace', () => {
      expect(
        isVersionOrReleaseCommit('  chore(release): version packages [skip ci]  '),
      ).toBe(true);
    });

    it('should return false for similar but incorrect legacy messages', () => {
      expect(isVersionOrReleaseCommit('chore(release): version packages')).toBe(false); // missing [skip ci]
      expect(isVersionOrReleaseCommit('chore(release): version package [skip ci]')).toBe(
        false,
      ); // singular package
      expect(isVersionOrReleaseCommit('feat(release): version packages [skip ci]')).toBe(
        false,
      ); // wrong type
    });
  });

  describe('non-release commits', () => {
    it('should return false for regular commits', () => {
      expect(isVersionOrReleaseCommit('feat: add new feature')).toBe(false);
      expect(isVersionOrReleaseCommit('fix: resolve bug')).toBe(false);
      expect(isVersionOrReleaseCommit('docs: update readme')).toBe(false);
      expect(isVersionOrReleaseCommit('chore: update dependencies')).toBe(false);
    });

    it('should return false for merge commits', () => {
      expect(
        isVersionOrReleaseCommit('Merge pull request #123 from feature/branch'),
      ).toBe(false);
      expect(isVersionOrReleaseCommit('Merge branch "main" into feature')).toBe(false);
    });

    it('should return false for empty or whitespace-only messages', () => {
      expect(isVersionOrReleaseCommit('')).toBe(false);
      expect(isVersionOrReleaseCommit('   ')).toBe(false);
      expect(isVersionOrReleaseCommit('\n\t')).toBe(false);
    });

    it('should return false for partial matches', () => {
      expect(isVersionOrReleaseCommit('chore(release): 1.2.3 extra text [skip ci]')).toBe(
        false,
      );
      expect(isVersionOrReleaseCommit('prefix chore(release): 1.2.3 [skip ci]')).toBe(
        false,
      );
      expect(
        isVersionOrReleaseCommit('chore(release): bump package versions [skip ci] extra'),
      ).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should fail for build metadata in version', () => {
      expect(isVersionOrReleaseCommit('chore(release): 1.2.3+build.1 [skip ci]')).toBe(
        false,
      );
      expect(
        isVersionOrReleaseCommit('chore(release): 1.2.3-alpha+build [skip ci]'),
      ).toBe(false);
      expect(
        isVersionOrReleaseCommit('chore(release): @scope/pack@1.2.3+build [skip ci]'),
      ).toBe(false);
    });

    it('should fail for malformed package names', () => {
      expect(isVersionOrReleaseCommit('chore(release): @/pack@1.2.3 [skip ci]')).toBe(
        false,
      );
      expect(isVersionOrReleaseCommit('chore(release): @scope/@1.2.3 [skip ci]')).toBe(
        false,
      );
      expect(
        isVersionOrReleaseCommit('chore(release): @@scope/pack@1.2.3 [skip ci]'),
      ).toBe(false);
      expect(isVersionOrReleaseCommit('chore(release): pack@@1.2.3 [skip ci]')).toBe(
        false,
      );
    });

    it('should pass for package name variations', () => {
      expect(isVersionOrReleaseCommit('chore(release): package-v2@1.2.3 [skip ci]')).toBe(
        true,
      );
      expect(isVersionOrReleaseCommit('chore(release): my.package@1.2.3 [skip ci]')).toBe(
        true,
      );
      expect(
        isVersionOrReleaseCommit('chore(release): package_name@1.2.3 [skip ci]'),
      ).toBe(true);
      expect(
        isVersionOrReleaseCommit('chore(release): @org-name/sub.package@1.2.3 [skip ci]'),
      ).toBe(true);
    });

    it('should pass for complex prerelease identifiers', () => {
      expect(
        isVersionOrReleaseCommit('chore(release): 1.2.3-alpha.beta.1 [skip ci]'),
      ).toBe(true);
      expect(isVersionOrReleaseCommit('chore(release): 1.2.3-0 [skip ci]')).toBe(true);
      expect(isVersionOrReleaseCommit('chore(release): 1.2.3-snapshot [skip ci]')).toBe(
        true,
      );
      expect(
        isVersionOrReleaseCommit(
          'chore(release): @scope/pack@1.2.3-next.20240101 [skip ci]',
        ),
      ).toBe(true);
    });

    it('should pass for boundary version numbers', () => {
      expect(isVersionOrReleaseCommit('chore(release): 0.0.0 [skip ci]')).toBe(true);
      expect(isVersionOrReleaseCommit('chore(release): 999.999.999 [skip ci]')).toBe(
        true,
      );
      expect(isVersionOrReleaseCommit('chore(release): 1.0.0-0 [skip ci]')).toBe(true);
    });

    it('should pass for mixed case in [skip ci]', () => {
      expect(isVersionOrReleaseCommit('chore(release): 1.2.3 [Skip CI]')).toBe(true);
      expect(isVersionOrReleaseCommit('chore(release): 1.2.3 [SKIP ci]')).toBe(true);
      expect(
        isVersionOrReleaseCommit('chore(release): @scope/pack@1.2.3 [SKIP CI]'),
      ).toBe(true);
    });

    it('should fail for alternative skip CI patterns', () => {
      expect(isVersionOrReleaseCommit('chore(release): 1.2.3 [ci skip]')).toBe(false);
      expect(isVersionOrReleaseCommit('chore(release): 1.2.3 [skip-ci]')).toBe(false);
      expect(isVersionOrReleaseCommit('chore(release): 1.2.3 ***NO_CI***')).toBe(false);
    });
  });

  describe('additional edge cases', () => {
    it('should fail for multiple [skip ci] tokens', () => {
      expect(isVersionOrReleaseCommit('chore(release): 1.2.3 [skip ci] [skip ci]')).toBe(
        false,
      );
    });
    it('should fail for trailing punctuation or noise', () => {
      expect(isVersionOrReleaseCommit('chore(release): 1.2.3 [skip ci].')).toBe(false);
      expect(isVersionOrReleaseCommit('chore(release): 1.2.3 [skip ci]!')).toBe(false);
    });
    it('should fail for newline or tab between parts', () => {
      expect(isVersionOrReleaseCommit('chore(release):\t1.2.3 [skip ci]')).toBe(false);
      expect(isVersionOrReleaseCommit('chore(release):\n1.2.3 [skip ci]')).toBe(false);
    });
    it('should fail for empty package name with @ sign', () => {
      expect(isVersionOrReleaseCommit('chore(release): @@1.2.3 [skip ci]')).toBe(false);
    });
    it('should fail for extra text inside brackets', () => {
      expect(isVersionOrReleaseCommit('chore(release): 1.2.3 [skip ci now]')).toBe(false);
    });
  });
});
