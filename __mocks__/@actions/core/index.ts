/**
 * This file is used to mock the `@actions/core` module in tests.
 */
import { vi } from 'vitest';

export const debug = vi.fn();
export const error = vi.fn();
export const info = vi.fn();
export const getInput = vi.fn();
export const setOutput = vi.fn();
export const setFailed = vi.fn();
export const warning = vi.fn();
