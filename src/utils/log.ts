import * as actionsCore from '@actions/core';
import * as changesetsLogger from '@changesets/logger';

export const CHANGESET_MESSAGE_PREFIX = '🦋';
export const ROBOT_MESSAGE_PREFIX = '';

export const log: typeof actionsCore & typeof changesetsLogger = {
  ...actionsCore,
  ...changesetsLogger,
  notice: changesetsLogger.info,
  warning: changesetsLogger.warn,
};
