import type * as coreType from '@actions/core';

const CORE_PREFIX_PATCHED = Symbol.for('changesetsAutopilot.corePrefixPatched');

export const ROBOT_MESSAGE_PREFIX = '🤖 ';

type CoreMethodName =
  | 'debug'
  | 'info'
  | 'notice'
  | 'warning'
  | 'error'
  | 'setFailed'
  | 'startGroup';

type PrefixableCore = typeof coreType & {
  [CORE_PREFIX_PATCHED]?: boolean;
};

type MutableCore = PrefixableCore & Record<string, unknown>;

export function prefixCoreMessage(
  message: unknown,
  prefix = ROBOT_MESSAGE_PREFIX,
): string {
  const normalized = message instanceof Error ? message.message : String(message);

  return normalized
    .split('\n')
    .map((line) => {
      if (line.length === 0 || line.startsWith(prefix)) {
        return line;
      }

      return `${prefix}${line}`;
    })
    .join('\n');
}

export function installCoreMessagePrefix(
  coreModule: PrefixableCore,
  prefix = ROBOT_MESSAGE_PREFIX,
): void {
  const mutableCore: MutableCore = coreModule;

  if (mutableCore[CORE_PREFIX_PATCHED]) {
    return;
  }

  const methods: CoreMethodName[] = [
    'debug',
    'info',
    'notice',
    'warning',
    'error',
    'setFailed',
    'startGroup',
  ];

  for (const methodName of methods) {
    const originalMethod = mutableCore[methodName];
    if (typeof originalMethod === 'function') {
      mutableCore[methodName] = (message: unknown, ...args: unknown[]) =>
        (originalMethod as (...callArgs: unknown[]) => unknown)(
          prefixCoreMessage(message, prefix),
          ...args,
        );
    }
  }

  mutableCore[CORE_PREFIX_PATCHED] = true;
}
