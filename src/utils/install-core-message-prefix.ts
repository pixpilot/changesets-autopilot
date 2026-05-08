import type * as coreType from '@actions/core';

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
  default?: unknown;
};

type MutableCore = PrefixableCore & Record<string, unknown>;

const patchedModules = new WeakSet<object>();

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
  const patchTargets = getPatchTargets(coreModule);

  for (const patchTarget of patchTargets) {
    if (!patchedModules.has(patchTarget)) {
      installPrefixForTarget(patchTarget as MutableCore, prefix);
      patchedModules.add(patchTarget);
    }
  }
}

function getPatchTargets(coreModule: PrefixableCore): object[] {
  const uniqueTargets = new Set<object>();

  uniqueTargets.add(coreModule);

  if (typeof coreModule.default === 'object' && coreModule.default !== null) {
    uniqueTargets.add(coreModule.default);
  }

  return [...uniqueTargets];
}

function installPrefixForTarget(targetCore: MutableCore, prefix: string): void {
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
    const originalMethod = targetCore[methodName];
    if (typeof originalMethod === 'function') {
      const wrappedMethod = (message: unknown, ...args: unknown[]) =>
        (originalMethod as (...callArgs: unknown[]) => unknown)(
          prefixCoreMessage(message, prefix),
          ...args,
        );

      setMethodSafely(targetCore, methodName, wrappedMethod);
    }
  }
}

function setMethodSafely(
  targetCore: MutableCore,
  methodName: CoreMethodName,
  wrappedMethod: (...args: unknown[]) => unknown,
): void {
  const writableTarget = targetCore as Record<string, unknown>;

  try {
    writableTarget[methodName] = wrappedMethod;
  } catch {
    const descriptor = Object.getOwnPropertyDescriptor(writableTarget, methodName);

    if (!descriptor || !descriptor.configurable) {
      return;
    }

    try {
      Object.defineProperty(writableTarget, methodName, {
        configurable: true,
        enumerable: descriptor.enumerable ?? true,
        writable: true,
        value: wrappedMethod,
      });
    } catch {
      // Ignore non-patchable descriptors to avoid crashing the action.
    }
  }
}
