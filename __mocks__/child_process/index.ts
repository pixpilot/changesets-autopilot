import type { Mock } from 'vitest';
/**
 * This file is used to mock the `child_process` module in tests.
 */
import { vi } from 'vitest';

export const execSync: Mock = vi.fn();
export const exec: Mock = vi.fn();
export const spawn: Mock = vi.fn();
export const fork: Mock = vi.fn();
