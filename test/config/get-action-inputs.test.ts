import * as fs from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getActionInputs } from '../../src/config';

vi.mock('@actions/core');
vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

const core = await import('@actions/core');
const getInput = core.getInput as unknown as ReturnType<typeof vi.fn>;
const warning = core.warning as unknown as ReturnType<typeof vi.fn>;
const existsSync = fs.existsSync as unknown as ReturnType<typeof vi.fn>;
const readFileSync = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;

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
    existsSync.mockReturnValue(false);
    readFileSync.mockReturnValue('');
  });

  it('should be defined', () => {
    expect(getActionInputs).toBeDefined();
  });

  it('returns default config when BRANCHES input is empty', () => {
    const result = getActionInputs();
    expect(result).toStrictEqual({
      githubToken: 'gh-token',
      npmToken: 'npm-token',
      botName: 'changesets-autopilot',
      branches: ['main', 'master', { name: 'next', prerelease: 'rc', channel: 'next' }],
      createRelease: true,
      pushTags: true,
      autoChangeset: false,
    });
  });

  it('uses baseBranch from .changeset/config.json when BRANCHES input is empty', () => {
    existsSync.mockReturnValue(true);
    readFileSync.mockReturnValue('{"baseBranch":"master"}');

    const result = getActionInputs();

    expect(result.branches).toStrictEqual([
      'master',
      { name: 'next', prerelease: 'rc', channel: 'next' },
    ]);
  });

  it('falls back to main/master/next when baseBranch is missing in .changeset/config.json', () => {
    existsSync.mockReturnValue(true);
    readFileSync.mockReturnValue('{"commit":false}');

    const result = getActionInputs();

    expect(result.branches).toStrictEqual([
      'main',
      'master',
      { name: 'next', prerelease: 'rc', channel: 'next' },
    ]);
  });

  it('falls back to next-only when baseBranch is next', () => {
    existsSync.mockReturnValue(true);
    readFileSync.mockReturnValue('{"baseBranch":"next"}');

    const result = getActionInputs();

    expect(result.branches).toStrictEqual([
      { name: 'next', prerelease: 'rc', channel: 'next' },
    ]);
  });

  it('parses valid YAML array for BRANCHES', () => {
    getInput.mockImplementation((name: string) => {
      if (name === 'BRANCHES') return '- main\n- name: dev\n  channel: dev';
      if (name === 'GITHUB_TOKEN') return 'gh-token';
      if (name === 'NPM_TOKEN') return 'npm-token';
      return '';
    });

    existsSync.mockReturnValue(true);
    readFileSync.mockReturnValue('{"baseBranch":"master"}');

    const result = getActionInputs();

    expect(existsSync).not.toHaveBeenCalled();
    expect(readFileSync).not.toHaveBeenCalled();
    expect(result.branches).toStrictEqual(['main', { name: 'dev', channel: 'dev' }]);
  });

  it('falls back to default config on invalid YAML', () => {
    getInput.mockImplementation((name: string) => {
      if (name === 'BRANCHES') return 'not: yaml: array';
      if (name === 'GITHUB_TOKEN') return 'gh-token';
      if (name === 'NPM_TOKEN') return 'npm-token';
      return '';
    });
    const result = getActionInputs();
    expect(result.branches).toStrictEqual([
      'main',
      'master',
      { name: 'next', prerelease: 'rc', channel: 'next' },
    ]);
  });

  it('falls back when .changeset/config.json cannot be parsed', () => {
    existsSync.mockReturnValue(true);
    readFileSync.mockReturnValue('{invalid json}');

    const result = getActionInputs();

    expect(warning).toHaveBeenCalledWith(
      expect.stringContaining('Failed to read .changeset/config.json'),
    );
    expect(result.branches).toStrictEqual([
      'main',
      'master',
      { name: 'next', prerelease: 'rc', channel: 'next' },
    ]);
  });

  it('uses BOT_NAME input if provided', () => {
    getInput.mockImplementation((name: string) => {
      if (name === 'BOT_NAME') return 'custom-bot';
      if (name === 'GITHUB_TOKEN') return 'gh-token';
      if (name === 'NPM_TOKEN') return 'npm-token';
      return '';
    });
    const result = getActionInputs();
    expect(result.botName).toBe('custom-bot');
  });

  it('throws if required github token is missing', () => {
    getInput.mockImplementation((name: string, options?: { required?: boolean }) => {
      if (options?.required && name === 'GITHUB_TOKEN') {
        throw new Error(`Input required and not supplied: ${name}`);
      }
      if (name === 'GITHUB_TOKEN') return '';
      if (name === 'NPM_TOKEN') return '';
      return '';
    });
    expect(() => getActionInputs()).toThrow();
  });

  it('allows missing npm token for OIDC publishing', () => {
    getInput.mockImplementation((name: string) => {
      if (name === 'GITHUB_TOKEN') return 'gh-token';
      if (name === 'NPM_TOKEN') return '';
      return '';
    });

    const result = getActionInputs();
    expect(result.npmToken).toBeUndefined();
  });

  it('defaults autoChangeset to false when AUTO_CHANGESET input is not provided', () => {
    getInput.mockImplementation((name: string) => {
      if (name === 'GITHUB_TOKEN') return 'gh-token';
      if (name === 'NPM_TOKEN') return 'npm-token';
      return '';
    });
    const result = getActionInputs();
    expect(result.autoChangeset).toBe(false);
  });

  it('sets autoChangeset to true when AUTO_CHANGESET input is true', () => {
    getInput.mockImplementation((name: string) => {
      if (name === 'AUTO_CHANGESET') return 'true';
      if (name === 'GITHUB_TOKEN') return 'gh-token';
      if (name === 'NPM_TOKEN') return 'npm-token';
      return '';
    });
    const result = getActionInputs();
    expect(result.autoChangeset).toBe(true);
  });

  it('sets autoChangeset to false when AUTO_CHANGESET input is false', () => {
    getInput.mockImplementation((name: string) => {
      if (name === 'AUTO_CHANGESET') return 'false';
      if (name === 'GITHUB_TOKEN') return 'gh-token';
      if (name === 'NPM_TOKEN') return 'npm-token';
      return '';
    });
    const result = getActionInputs();
    expect(result.autoChangeset).toBe(false);
  });

  it('throws error if BRANCHES input is valid YAML but not an array', () => {
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
      'master',
      { name: 'next', prerelease: 'rc', channel: 'next' },
    ]);
  });
});
