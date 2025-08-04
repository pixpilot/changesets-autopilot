import { describe, test, expect } from 'vitest';

import { run } from '../src/index';

describe('index', () => {
  test('should export a run function', () => {
    expect(typeof run).toBe('function');
  });
});
