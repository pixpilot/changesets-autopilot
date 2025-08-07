import { describe, it, expect } from 'vitest';

import { parsePublishedPackageNames } from '../../src/utils/parse-published-packages';

const exampleOutput = `New tag: @scope/pkg-a@1.0.0\nNew tag: pkg-b@2.3.4\nSome other log line\nNew tag: @scope/pkg-c@0.1.2`;

const exampleOutputWithButterfly = `🦋  warn Received 404 for npm info "@pixpilot/p11"
🦋  info npm info @pixpilot/p11
🦋  info @pixpilot/p11 is being published because our local version (0.0.1) has not been published on npm
🦋  info Publishing "@pixpilot/p11" at "0.0.1"
🦋  success packages published successfully:
🦋  @pixpilot/p11@0.0.1
🦋  Creating git tag...
🦋  New tag:  v0.0.1`;

describe('parsePublishedPackageNames', () => {
  it('extracts package names from changeset publish output', () => {
    const result = parsePublishedPackageNames(exampleOutput);
    expect(Array.from(result)).toEqual(['@scope/pkg-a', 'pkg-b', '@scope/pkg-c']);
  });

  it('extracts package names from butterfly emoji output', () => {
    const result = parsePublishedPackageNames(exampleOutputWithButterfly);
    expect(Array.from(result)).toEqual(['@pixpilot/p11']);
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

  it('handles mixed formats (both New tag and butterfly emoji)', () => {
    const output = `New tag: pkg-traditional@1.0.0
🦋  info Publishing "@modern/package" at "2.0.0"
🦋  @modern/package@2.0.0
🦋  New tag:  v2.0.0`;
    const result = parsePublishedPackageNames(output);
    expect(Array.from(result)).toEqual(['pkg-traditional', '@modern/package']);
  });

  it('handles simple version tags with packages in success output', () => {
    const output = `🦋  success packages published successfully:
🦋  @pixpilot/p11@0.0.1
🦋  Creating git tag...
🦋  New tag:  v0.0.1`;
    const result = parsePublishedPackageNames(output);
    expect(Array.from(result)).toEqual(['@pixpilot/p11']);
  });

  it('extracts package names from Publishing info lines', () => {
    const output = `🦋  info Publishing "@scope/my-package" at "1.2.3"
🦋  info Publishing "single-package" at "0.1.0"
🦋  New tag: v1.2.3`;
    const result = parsePublishedPackageNames(output);
    expect(Array.from(result)).toEqual(['@scope/my-package', 'single-package']);
  });

  it('handles your exact example output format', () => {
    const output = `🦋  warn Received 404 for npm info "@pixpilot/p11"
🦋  info npm info @pixpilot/p11
🦋  info @pixpilot/p11 is being published because our local version (0.0.1) has not been published on npm
🦋  info Publishing "@pixpilot/p11" at "0.0.1"
🦋  success packages published successfully:
🦋  @pixpilot/p11@0.0.1
🦋  Creating git tag...
🦋  New tag:  v0.0.1`;
    const result = parsePublishedPackageNames(output);
    expect(Array.from(result)).toEqual(['@pixpilot/p11']);
  });
});
