import { describe, test, expect, vi } from 'vitest';

vi.mock('simple-git', () => {
  const addConfig = vi.fn().mockResolvedValue(undefined);
  const gitInstance = { addConfig };
  const simpleGit = vi.fn(() => gitInstance);
  return { default: simpleGit };
});

import { configureGit } from '../../src/git/configure-git';

describe('configureGit', () => {
  test('should be a function', () => {
    expect(typeof configureGit).toBe('function');
  });

  test('should configure git user and email', async () => {
    const botName = 'pixpilot';
    const expectedName = `${botName}[bot]`;
    const expectedEmail = `${botName}[bot]@users.noreply.github.com`;

    const git = await configureGit(botName);

    expect(git.addConfig).toHaveBeenCalledWith('user.name', expectedName);
    expect(git.addConfig).toHaveBeenCalledWith('user.email', expectedEmail);
    expect(typeof git.addConfig).toBe('function');
  });
});
