import type { Mock } from 'vitest';
/**
 * This file is used to mock the `@actions/core` module in tests.
 */
import { vi } from 'vitest';

export const debug: Mock = vi.fn();
export const error: Mock = vi.fn();
export const info: Mock = vi.fn();
export const getInput: Mock = vi.fn();
export const setOutput: Mock = vi.fn();
export const setFailed: Mock = vi.fn();
export const warning: Mock = vi.fn();
