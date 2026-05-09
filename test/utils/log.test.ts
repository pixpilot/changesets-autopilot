import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCore = vi.hoisted(() => ({
  debug: vi.fn(),
  error: vi.fn(),
  getInput: vi.fn(),
  info: vi.fn(),
  notice: vi.fn(),
  setFailed: vi.fn(),
  setOutput: vi.fn(),
  startGroup: vi.fn(),
  warning: vi.fn(),
}));

const mockLogger = vi.hoisted(() => ({
  error: vi.fn(),
  info: vi.fn(),
  log: vi.fn(),
  prefix: '🦋 ',
  success: vi.fn(),
  warn: vi.fn(),
}));

vi.mock('@actions/core', () => mockCore);
vi.mock('@changesets/logger', () => mockLogger);

function resetMockCore() {
  Object.assign(mockCore, {
    debug: vi.fn(),
    error: vi.fn(),
    getInput: vi.fn(),
    info: vi.fn(),
    notice: vi.fn(),
    setFailed: vi.fn(),
    setOutput: vi.fn(),
    startGroup: vi.fn(),
    warning: vi.fn(),
  });
}

function resetMockLogger() {
  Object.assign(mockLogger, {
    error: vi.fn(),
    info: vi.fn(),
    log: vi.fn(),
    prefix: '🦋 ',
    success: vi.fn(),
    warn: vi.fn(),
  });
}

describe('log utility', () => {
  beforeEach(() => {
    vi.resetModules();
    resetMockCore();
    resetMockLogger();
  });

  it('forwards info logs to @changesets/logger', async () => {
    const { log } = await import('../../src/utils/log');

    log.info('hello');

    expect(mockLogger.info).toHaveBeenCalledWith('hello');
  });

  it('forwards warnings to @changesets/logger warn', async () => {
    const { log } = await import('../../src/utils/log');

    log.warning('warn');

    expect(mockLogger.warn).toHaveBeenCalledWith('warn');
  });

  it('aliases notice to @changesets/logger info', async () => {
    const { log } = await import('../../src/utils/log');

    log.notice('notice');

    expect(mockLogger.info).toHaveBeenCalledWith('notice');
  });

  it('forwards errors to @changesets/logger', async () => {
    const { log } = await import('../../src/utils/log');

    log.error('boom');

    expect(mockLogger.error).toHaveBeenCalledWith('boom');
  });

  it('keeps @actions/core passthrough methods available', async () => {
    const { log } = await import('../../src/utils/log');

    log.setOutput('published', 'true');
    log.getInput('GITHUB_TOKEN');
    log.setFailed('failed');

    expect(mockCore.setOutput).toHaveBeenCalledWith('published', 'true');
    expect(mockCore.getInput).toHaveBeenCalledWith('GITHUB_TOKEN');
    expect(mockCore.setFailed).toHaveBeenCalledWith('failed');
  });
});
