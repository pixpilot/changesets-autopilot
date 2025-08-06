/**
 * This file is used to mock the `child_process` module in tests.
 */
import { vi } from 'vitest';

export const execSync = vi.fn();
export const exec = vi.fn();
export const spawn = vi.fn();
export const fork = vi.fn();
