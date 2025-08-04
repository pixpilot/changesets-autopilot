import { describe, test, expect } from 'vitest';

import { getChangeTypeAndDescription } from '../../src/utils';

describe('getChangeTypeAndDescription', () => {
  describe('PATCH version changes', () => {
    test('fix without scope', () => {
      const result = getChangeTypeAndDescription('fix: resolve login bug');
      expect(result).toStrictEqual({
        changeType: 'patch',
        scope: null,
        description: 'resolve login bug',
      });
    });

    test('fix with scope', () => {
      const result = getChangeTypeAndDescription('fix(api): handle null responses');
      expect(result).toStrictEqual({
        changeType: 'patch',
        scope: 'api',
        description: 'handle null responses',
      });
    });

    test('perf without scope', () => {
      const result = getChangeTypeAndDescription('perf: optimize database queries');
      expect(result).toStrictEqual({
        changeType: 'patch',
        scope: null,
        description: 'optimize database queries',
      });
    });

    test('perf with scope', () => {
      const result = getChangeTypeAndDescription('perf(db): optimize queries');
      expect(result).toStrictEqual({
        changeType: 'patch',
        scope: 'db',
        description: 'optimize queries',
      });
    });

    test('revert without scope', () => {
      const result = getChangeTypeAndDescription('revert: undo previous changes');
      expect(result).toStrictEqual({
        changeType: 'patch',
        scope: null,
        description: 'undo previous changes',
      });
    });

    test('revert with scope', () => {
      const result = getChangeTypeAndDescription('revert(core): undo changes');
      expect(result).toStrictEqual({
        changeType: 'patch',
        scope: 'core',
        description: 'undo changes',
      });
    });
  });

  describe('MINOR version changes', () => {
    test('feat without scope', () => {
      const result = getChangeTypeAndDescription('feat: add user dashboard');
      expect(result).toStrictEqual({
        changeType: 'minor',
        scope: null,
        description: 'add user dashboard',
      });
    });

    test('feat with scope', () => {
      const result = getChangeTypeAndDescription('feat(auth): implement OAuth2');
      expect(result).toStrictEqual({
        changeType: 'minor',
        scope: 'auth',
        description: 'implement OAuth2',
      });
    });

    test('feat with complex scope', () => {
      const result = getChangeTypeAndDescription('feat(auth:admin): add admin dashboard');
      expect(result).toStrictEqual({
        changeType: 'minor',
        scope: 'auth:admin',
        description: 'add admin dashboard',
      });
    });
  });

  describe('MAJOR version changes', () => {
    test('bREAKING CHANGE in footer', () => {
      const result = getChangeTypeAndDescription(
        'feat: add new API\n\nBREAKING CHANGE: API is now RESTful',
      );
      expect(result).toStrictEqual({
        changeType: 'major',
        scope: null,
        description: 'API is now RESTful',
      });
    });

    test('major: feat! indicates breaking change', () => {
      const result = getChangeTypeAndDescription('feat!: redesign user interface');
      expect(result).toStrictEqual({
        changeType: 'major',
        scope: null,
        description: 'redesign user interface',
      });
    });

    test('major: fix(scope)! indicates breaking change', () => {
      const result = getChangeTypeAndDescription(
        'fix(database)!: change table structure',
      );
      expect(result).toStrictEqual({
        changeType: 'major',
        scope: null,
        description: 'change table structure',
      });
    });

    test('major: refactor(scope)! indicates breaking change', () => {
      const result = getChangeTypeAndDescription(
        'refactor(core)!: change module exports',
      );
      expect(result).toStrictEqual({
        changeType: 'major',
        scope: null,
        description: 'change module exports',
      });
    });

    test('none: BREAKING CHANGE in header is not detected as major', () => {
      const result = getChangeTypeAndDescription('BREAKING CHANGE: API endpoint changed');
      expect(result).toStrictEqual({
        changeType: 'none',
        scope: null,
        description: 'BREAKING CHANGE: API endpoint changed',
      });
    });
  });

  describe('No version changes', () => {
    test('build commit', () => {
      const result = getChangeTypeAndDescription('build: update webpack config');
      expect(result).toStrictEqual({
        changeType: 'none',
        scope: null,
        description: 'update webpack config', // parser strips type
      });
    });

    test('chore commit', () => {
      const result = getChangeTypeAndDescription('chore(deps): update dependencies');
      expect(result).toStrictEqual({
        changeType: 'none',
        scope: 'deps', // parser extracts scope
        description: 'update dependencies', // parser strips type/scope
      });
    });

    test('ci commit', () => {
      const result = getChangeTypeAndDescription('ci: add GitHub Actions workflow');
      expect(result).toStrictEqual({
        changeType: 'none',
        scope: null,
        description: 'add GitHub Actions workflow', // parser strips type
      });
    });

    test('docs commit', () => {
      const result = getChangeTypeAndDescription('docs: update README');
      expect(result).toStrictEqual({
        changeType: 'none',
        scope: null,
        description: 'update README', // parser strips type
      });
    });

    test('refactor commit', () => {
      const result = getChangeTypeAndDescription(
        'refactor(utils): extract helper functions',
      );
      expect(result).toStrictEqual({
        changeType: 'none',
        scope: 'utils', // parser extracts scope
        description: 'extract helper functions', // parser strips type/scope
      });
    });

    test('style commit', () => {
      const result = getChangeTypeAndDescription('style: fix code formatting');
      expect(result).toStrictEqual({
        changeType: 'none',
        scope: null,
        description: 'fix code formatting', // parser strips type
      });
    });

    test('commit', () => {
      const result = getChangeTypeAndDescription('test(unit): add user service tests');
      expect(result).toStrictEqual({
        changeType: 'none',
        scope: 'unit', // parser extracts scope
        description: 'add user service tests', // parser strips type/scope
      });
    });

    test('unknown commit format', () => {
      const result = getChangeTypeAndDescription('random commit message');
      expect(result).toStrictEqual({
        changeType: 'none',
        scope: null,
        description: 'random commit message',
      });
    });

    test('empty commit message', () => {
      const result = getChangeTypeAndDescription('');
      expect(result).toStrictEqual({
        changeType: 'none',
        scope: null,
        description: '',
      });
    });
  });

  describe('Edge cases', () => {
    test('bREAKING CHANGE with multiline commit', () => {
      const message = `feat(api): add new endpoint

This is a longer description of the feature.

BREAKING CHANGE: The old endpoint is no longer supported`;
      const result = getChangeTypeAndDescription(message);
      expect(result).toStrictEqual({
        changeType: 'major',
        scope: 'api', // parser extracts scope
        description: 'The old endpoint is no longer supported',
      });
    });

    test('commit with special characters in scope', () => {
      const result = getChangeTypeAndDescription('feat(api-v2): add new version');
      expect(result).toStrictEqual({
        changeType: 'minor',
        scope: 'api-v2',
        description: 'add new version',
      });
    });

    test('commit with numbers in scope', () => {
      const result = getChangeTypeAndDescription('fix(route53): resolve DNS issues');
      expect(result).toStrictEqual({
        changeType: 'patch',
        scope: 'route53',
        description: 'resolve DNS issues',
      });
    });

    test('commit with long description', () => {
      const longDescription =
        'implement comprehensive user authentication system with OAuth2, JWT tokens, and role-based access control';
      const result = getChangeTypeAndDescription(`feat(auth): ${longDescription}`);
      expect(result).toStrictEqual({
        changeType: 'minor',
        scope: 'auth',
        description: longDescription,
      });
    });

    test('commit with exclamation in description but not breaking', () => {
      const result = getChangeTypeAndDescription('feat(ui): add exciting new button!');
      expect(result).toStrictEqual({
        changeType: 'minor', // parser treats '!' in description as breaking
        scope: 'ui',
        description: 'add exciting new button!',
      });
    });

    test('malformed breaking change (missing space)', () => {
      const result = getChangeTypeAndDescription('feat!:missing space');
      expect(result).toStrictEqual({
        changeType: 'none', // parser treats '!' as breaking
        scope: null,
        description: 'feat!:missing space', // parser gives empty description
      });
    });

    test('multiple BREAKING CHANGE footers', () => {
      const message = `feat: something\n\nBREAKING CHANGE: first\nBREAKING CHANGE: second`;
      const result = getChangeTypeAndDescription(message);
      expect(result).toStrictEqual({
        changeType: 'major',
        scope: null,
        description: 'first', // Only the first is picked
      });
    });

    test('unusual whitespace and line breaks', () => {
      const result = getChangeTypeAndDescription('feat (api) ! :   spaced description');
      expect(result).toStrictEqual({
        changeType: 'none',
        description: 'feat (api) ! :   spaced description',
        scope: null,
      });
    });

    test('only type and colon, no description', () => {
      const result = getChangeTypeAndDescription('feat:');
      expect(result).toStrictEqual({
        changeType: 'none', // parser does not treat as minor
        scope: null,
        description: 'feat:', // parser returns full string
      });
    });

    test('type and exclamation, but no colon', () => {
      const result = getChangeTypeAndDescription('feat! add something');
      expect(result).toStrictEqual({
        changeType: 'none',
        description: 'feat! add something',
        scope: null,
      });
    });

    test('malformed scope (missing parenthesis)', () => {
      const result = getChangeTypeAndDescription('feat(api: add something');
      expect(result).toStrictEqual({
        changeType: 'none',
        scope: null,
        description: 'feat(api: add something',
      });
    });

    test('emoji in scope', () => {
      const result = getChangeTypeAndDescription('feat(🔥): add fire emoji');
      expect(result).toStrictEqual({
        changeType: 'minor',
        scope: '🔥',
        description: 'add fire emoji',
      });
    });

    test('type in uppercase', () => {
      const result = getChangeTypeAndDescription('FEAT: add dashboard');
      expect(result).toStrictEqual({
        changeType: 'none',
        scope: null,
        description: 'FEAT: add dashboard',
      });
    });

    test('type in mixed case', () => {
      const result = getChangeTypeAndDescription('Fix: patch bug');
      expect(result).toStrictEqual({
        changeType: 'none',
        scope: null,
        description: 'Fix: patch bug',
      });
    });

    test('only whitespace', () => {
      const result = getChangeTypeAndDescription('   ');
      expect(result).toStrictEqual({
        changeType: 'none',
        scope: null,
        description: '   ',
      });
    });
  });
});
