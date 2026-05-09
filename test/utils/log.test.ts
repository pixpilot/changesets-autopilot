import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCore = vi.hoisted(() => ({
  debug: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  notice: vi.fn(),
  setFailed: vi.fn(),
  startGroup: vi.fn(),
  warning: vi.fn(),
}));

vi.mock('@actions/core', () => mockCore);

function resetMockCore() {
  Object.assign(mockCore, {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    notice: vi.fn(),
    setFailed: vi.fn(),
    startGroup: vi.fn(),
    warning: vi.fn(),
  });
}

describe('log utility', () => {
  beforeEach(() => {
    vi.resetModules();
    resetMockCore();
  });

  it('prefixCoreMessage prefixes each non-empty line', async () => {
    const { prefixCoreMessage, ROBOT_MESSAGE_PREFIX } =
      await import('../../src/utils/log');

    expect(prefixCoreMessage('line one\nline two')).toBe(
      `${ROBOT_MESSAGE_PREFIX}line one\n${ROBOT_MESSAGE_PREFIX}line two`,
    );
  });

  it('prefixCoreMessage handles Error messages', async () => {
    const { prefixCoreMessage, ROBOT_MESSAGE_PREFIX } =
      await import('../../src/utils/log');

    expect(prefixCoreMessage(new Error('line one\nline two'))).toBe(
      `${ROBOT_MESSAGE_PREFIX}line one\n${ROBOT_MESSAGE_PREFIX}line two`,
    );
  });

  it('prefixCoreMessage preserves empty lines with a custom prefix', async () => {
    const { prefixCoreMessage } = await import('../../src/utils/log');

    expect(prefixCoreMessage('line one\n\nline two', '>> ')).toBe(
      '>> line one\n\n>> line two',
    );
  });

  it('prefixCoreMessage does not duplicate robot prefix', async () => {
    const { prefixCoreMessage, ROBOT_MESSAGE_PREFIX } =
      await import('../../src/utils/log');

    expect(prefixCoreMessage(`${ROBOT_MESSAGE_PREFIX}already prefixed`)).toBe(
      `${ROBOT_MESSAGE_PREFIX}already prefixed`,
    );
  });

  it('prefixCoreMessage does not prefix changeset butterfly lines', async () => {
    const { prefixCoreMessage, CHANGESET_MESSAGE_PREFIX } =
      await import('../../src/utils/log');

    expect(prefixCoreMessage(`${CHANGESET_MESSAGE_PREFIX} changeset: added`)).toBe(
      `${CHANGESET_MESSAGE_PREFIX} changeset: added`,
    );
  });

  it('log.info sends prefixed message in non-vitest runtime', async () => {
    vi.stubEnv('VITEST', 'false');

    const core = await import('@actions/core');
    const { log, ROBOT_MESSAGE_PREFIX } = await import('../../src/utils/log');

    log.info('hello');

    expect(core.info).toHaveBeenCalledWith(`${ROBOT_MESSAGE_PREFIX}hello`);

    vi.unstubAllEnvs();
  });

  it('log.warning keeps message unchanged in vitest runtime', async () => {
    vi.stubEnv('VITEST', 'true');

    const core = await import('@actions/core');
    const { log } = await import('../../src/utils/log');

    log.warning('warn');

    expect(core.warning).toHaveBeenCalledWith('warn');

    vi.unstubAllEnvs();
  });

  it('log.notice returns undefined when the core method is unavailable', async () => {
    const { log } = await import('../../src/utils/log');

    (mockCore as Record<string, unknown>).notice = null;

    expect(log.notice('notice')).toBeUndefined();
  });
});
