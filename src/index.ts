/**
 * The entrypoint for the action. This file simply imports and runs the action's
 * main logic.
 */
import process from 'node:process';

import { run } from './main.js';

/* istanbul ignore next */
run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
