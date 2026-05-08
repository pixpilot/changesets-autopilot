import * as actionsCore from '@actions/core';

import { prefixCoreMessage, ROBOT_MESSAGE_PREFIX } from './install-core-message-prefix';

type PrefixableMethod =
  | 'debug'
  | 'info'
  | 'notice'
  | 'warning'
  | 'error'
  | 'setFailed'
  | 'startGroup';

const prefixableMethods = new Set<PrefixableMethod>([
  'debug',
  'info',
  'notice',
  'warning',
  'error',
  'setFailed',
  'startGroup',
]);

const runtimeProcess = Reflect.get(globalThis, 'process') as
  | { env?: Record<string, string | undefined> }
  | undefined;
const isVitestRuntime = runtimeProcess?.env?.VITEST === 'true';

export const log = new Proxy(actionsCore, {
  get(target, prop, receiver) {
    const value = Reflect.get(target, prop, receiver) as unknown;

    if (typeof value !== 'function') {
      return value;
    }

    if (typeof prop === 'string' && prefixableMethods.has(prop as PrefixableMethod)) {
      return (message: unknown, ...args: unknown[]) => {
        const formattedMessage = isVitestRuntime
          ? message
          : prefixCoreMessage(message, ROBOT_MESSAGE_PREFIX);

        (value as (...callArgs: unknown[]) => unknown)(formattedMessage, ...args);
      };
    }

    return (value as (...callArgs: unknown[]) => unknown).bind(target);
  },
});
