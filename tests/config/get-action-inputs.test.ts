import { describe, test, expect, beforeEach, vi } from 'vitest';

import { getActionInputs } from '../../src/config';

vi.mock('@actions/core');

const core = await import('@actions/core');
const getInput = core.getInput as unknown as ReturnType<typeof vi.fn>;
const warning = core.warning as unknown as ReturnType<typeof vi.fn>;

describe('getActionInputs', () => {
  // Setup mock implementations for each test
  beforeEach(() => {
    getInput.mockImplementation((name: string) => {
      if (name === 'GITHUB_TOKEN') return 'gh-token';
      if (name === 'NPM_TOKEN') return 'npm-token';
      if (name === 'BOT_NAME') return '';
      if (name === 'BRANCHES') return '';
      return '';
    });
    warning.mockImplementation(() => {});
  });

  test('should be defined', () => {
    expect(getActionInputs).toBeDefined();
  });

  test('returns default config when BRANCHES input is empty', () => {
    const result = getActionInputs();
    expect(result).toStrictEqual({
      githubToken: 'gh-token',
      npmToken: 'npm-token',
      botName: 'changesets-autopilot',
      branches: ['main', { name: 'next', prerelease: 'rc', channel: 'next' }],
      createRelease: true,
      pushTags: true,
      autoChangeset: false,
    });
  });

  test('parses valid YAML array for BRANCHES', () => {
    getInput.mockImplementation((name: string) => {
      if (name === 'BRANCHES') return '- main\n- name: dev\n  channel: dev';
      if (name === 'GITHUB_TOKEN') return 'gh-token';
      if (name === 'NPM_TOKEN') return 'npm-token';
      return '';
    });
    const result = getActionInputs();
    expect(result.branches).toStrictEqual(['main', { name: 'dev', channel: 'dev' }]);
  });

  test('falls back to default config on invalid YAML', () => {
    getInput.mockImplementation((name: string) => {
      if (name === 'BRANCHES') return 'not: yaml: array';
      if (name === 'GITHUB_TOKEN') return 'gh-token';
      if (name === 'NPM_TOKEN') return 'npm-token';
      return '';
    });
    const result = getActionInputs();
    expect(result.branches).toStrictEqual([
      'main',
      { name: 'next', prerelease: 'rc', channel: 'next' },
    ]);
  });

  test('uses BOT_NAME input if provided', () => {
    getInput.mockImplementation((name: string) => {
      if (name === 'BOT_NAME') return 'custom-bot';
      if (name === 'GITHUB_TOKEN') return 'gh-token';
      if (name === 'NPM_TOKEN') return 'npm-token';
      return '';
    });
    const result = getActionInputs();
    expect(result.botName).toBe('custom-bot');
  });

  test('throws if required tokens are missing', () => {
    getInput.mockImplementation((name: string, options?: { required?: boolean }) => {
      if (options?.required && (name === 'GITHUB_TOKEN' || name === 'NPM_TOKEN')) {
        throw new Error(`Input required and not supplied: ${name}`);
      }
      if (name === 'GITHUB_TOKEN') return '';
      if (name === 'NPM_TOKEN') return '';
      return '';
    });
    expect(() => getActionInputs()).toThrow();
  });

  test('defaults autoChangeset to false when AUTO_CHANGESET input is not provided', () => {
    getInput.mockImplementation((name: string) => {
      if (name === 'GITHUB_TOKEN') return 'gh-token';
      if (name === 'NPM_TOKEN') return 'npm-token';
      return '';
    });
    const result = getActionInputs();
    expect(result.autoChangeset).toBe(false);
  });

  test('sets autoChangeset to true when AUTO_CHANGESET input is true', () => {
    getInput.mockImplementation((name: string) => {
      if (name === 'AUTO_CHANGESET') return 'true';
      if (name === 'GITHUB_TOKEN') return 'gh-token';
      if (name === 'NPM_TOKEN') return 'npm-token';
      return '';
    });
    const result = getActionInputs();
    expect(result.autoChangeset).toBe(true);
  });

  test('sets autoChangeset to false when AUTO_CHANGESET input is false', () => {
    getInput.mockImplementation((name: string) => {
      if (name === 'AUTO_CHANGESET') return 'false';
      if (name === 'GITHUB_TOKEN') return 'gh-token';
      if (name === 'NPM_TOKEN') return 'npm-token';
      return '';
    });
    const result = getActionInputs();
    expect(result.autoChangeset).toBe(false);
  });

  test('throws error if BRANCHES input is valid YAML but not an array', () => {
    getInput.mockImplementation((name: string) => {
      if (name === 'BRANCHES') return 'foo: bar'; // valid YAML object, not array
      if (name === 'GITHUB_TOKEN') return 'gh-token';
      if (name === 'NPM_TOKEN') return 'npm-token';
      return '';
    });
    const result = getActionInputs();
    expect(warning).toHaveBeenCalledWith(
      expect.stringContaining('BRANCHES input must be a YAML array'),
    );
    expect(result.branches).toStrictEqual([
      'main',
      { name: 'next', prerelease: 'rc', channel: 'next' },
    ]);
  });
});
