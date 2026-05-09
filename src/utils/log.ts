import { env } from 'node:process';
import * as actionsCore from '@actions/core';

export const ROBOT_MESSAGE_PREFIX = '';
export const CHANGESET_MESSAGE_PREFIX = '🦋';

const isVitestRuntime = env.VITEST === 'true';
const coreModule = actionsCore as unknown as Record<string, unknown>;

export function prefixCoreMessage(
  message: unknown,
  prefix = ROBOT_MESSAGE_PREFIX,
): string {
  const normalized = message instanceof Error ? message.message : String(message);

  return normalized
    .split('\n')
    .map((line) => {
      if (
        line.length === 0 ||
        line.startsWith(prefix) ||
        line.startsWith(CHANGESET_MESSAGE_PREFIX)
      ) {
        return line;
      }

      return `${prefix}${line}`;
    })
    .join('\n');
}

function formatMessage(message: unknown): unknown {
  return isVitestRuntime ? message : prefixCoreMessage(message, ROBOT_MESSAGE_PREFIX);
}

function invokeCore(methodName: string, ...args: unknown[]): unknown {
  const method = coreModule[methodName];

  if (typeof method === 'function') {
    return (method as (...callArgs: unknown[]) => unknown)(...args);
  }

  return undefined;
}

function withPrefix(methodName: string) {
  return (message: unknown, ...args: unknown[]) =>
    invokeCore(methodName, formatMessage(message), ...args);
}

export const log: typeof actionsCore = {
  ...actionsCore,
  debug: withPrefix('debug'),
  info: withPrefix('info'),
  notice: withPrefix('notice'),
  warning: withPrefix('warning'),
  error: withPrefix('error'),
  setFailed: withPrefix('setFailed'),
  startGroup: withPrefix('startGroup'),
};
