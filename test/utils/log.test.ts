import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@actions/core', () => ({
  debug: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  notice: vi.fn(),
  setFailed: vi.fn(),
  startGroup: vi.fn(),
  warning: vi.fn(),
}));

describe('log utility', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('prefixCoreMessage prefixes each non-empty line', async () => {
    const { prefixCoreMessage } = await import('../../src/utils/log');

    expect(prefixCoreMessage('line one\nline two')).toBe('🤖 line one\n🤖 line two');
  });

  it('prefixCoreMessage does not duplicate robot prefix', async () => {
    const { prefixCoreMessage, ROBOT_MESSAGE_PREFIX } =
      await import('../../src/utils/log');

    expect(prefixCoreMessage(`${ROBOT_MESSAGE_PREFIX}already prefixed`)).toBe(
      '🤖 already prefixed',
    );
  });

  it('prefixCoreMessage does not prefix changeset butterfly lines', async () => {
    const { prefixCoreMessage } = await import('../../src/utils/log');

    expect(prefixCoreMessage('🦋 changeset: added')).toBe('🦋 changeset: added');
  });

  it('log.info sends prefixed message in non-vitest runtime', async () => {
    vi.stubEnv('VITEST', 'false');

    const core = await import('@actions/core');
    const { log } = await import('../../src/utils/log');

    log.info('hello');

    expect(core.info).toHaveBeenCalledWith('🤖 hello');

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
});
