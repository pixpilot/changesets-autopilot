import { describe, expect, it, vi } from 'vitest';

import {
  installCoreMessagePrefix,
  prefixCoreMessage,
  ROBOT_MESSAGE_PREFIX,
} from '../../src/utils/install-core-message-prefix';

describe('installCoreMessagePrefix', () => {
  it('prefixes core messages with robot icon', () => {
    const info = vi.fn();
    const warning = vi.fn();

    const fakeCore = {
      info,
      warning,
    } as unknown as Parameters<typeof installCoreMessagePrefix>[0];

    installCoreMessagePrefix(fakeCore);
    fakeCore.info('hello');
    fakeCore.warning('warn');

    expect(info).toHaveBeenCalledWith('🤖 hello');
    expect(warning).toHaveBeenCalledWith('🤖 warn');
  });

  it('prefixes each non-empty line for multiline messages', () => {
    expect(prefixCoreMessage('line one\nline two')).toBe('🤖 line one\n🤖 line two');
  });

  it('does not duplicate prefix when message already starts with it', () => {
    expect(prefixCoreMessage(`${ROBOT_MESSAGE_PREFIX}already prefixed`)).toBe(
      '🤖 already prefixed',
    );
  });

  it('is idempotent when installed multiple times', () => {
    const info = vi.fn();

    const fakeCore = {
      info,
    } as unknown as Parameters<typeof installCoreMessagePrefix>[0];

    installCoreMessagePrefix(fakeCore);
    installCoreMessagePrefix(fakeCore);

    fakeCore.info('hello');

    expect(info).toHaveBeenCalledTimes(1);
    expect(info).toHaveBeenCalledWith('🤖 hello');
  });

  it('does not throw when methods are read-only', () => {
    const debug = vi.fn();

    const fakeCore = {};
    Object.defineProperty(fakeCore, 'debug', {
      value: debug,
      writable: false,
      configurable: false,
      enumerable: true,
    });

    expect(() =>
      installCoreMessagePrefix(
        fakeCore as Parameters<typeof installCoreMessagePrefix>[0],
      ),
    ).not.toThrow();

    (fakeCore as { debug: (message: string) => void }).debug('hello');
    expect(debug).toHaveBeenCalledWith('hello');
  });

  it('patches mutable default export when namespace methods are read-only', () => {
    const info = vi.fn();

    const mutableCore = {
      info,
    };

    const namespaceCore = {} as {
      default: typeof mutableCore;
      info: (message: string) => void;
    };

    Object.defineProperty(namespaceCore, 'default', {
      value: mutableCore,
      writable: false,
      configurable: false,
      enumerable: true,
    });

    Object.defineProperty(namespaceCore, 'info', {
      get: () => mutableCore.info,
      configurable: false,
      enumerable: true,
    });

    installCoreMessagePrefix(
      namespaceCore as unknown as Parameters<typeof installCoreMessagePrefix>[0],
    );

    namespaceCore.info('hello');
    expect(info).toHaveBeenCalledWith('🤖 hello');
  });
});
