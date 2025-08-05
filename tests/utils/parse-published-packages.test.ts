import { describe, it, expect } from 'vitest';

import { parsePublishedPackageNames } from '../../src/utils/parse-published-packages';

const exampleOutput = `New tag: @scope/pkg-a@1.0.0\nNew tag: pkg-b@2.3.4\nSome other log line\nNew tag: @scope/pkg-c@0.1.2`;

describe('parsePublishedPackageNames', () => {
  it('extracts package names from changeset publish output', () => {
    const result = parsePublishedPackageNames(exampleOutput);
    expect(Array.from(result)).toEqual(['@scope/pkg-a', 'pkg-b', '@scope/pkg-c']);
  });

  it('returns empty set if no tags found', () => {
    const result = parsePublishedPackageNames('No tags here');
    expect(result.size).toBe(0);
  });

  it('handles mixed output gracefully', () => {
    const output = `Random log\nNew tag: pkg-x@0.0.1\nAnother log\nNew tag: @scope/pkg-y@2.0.0`;
    const result = parsePublishedPackageNames(output);
    expect(Array.from(result)).toEqual(['pkg-x', '@scope/pkg-y']);
  });
});
