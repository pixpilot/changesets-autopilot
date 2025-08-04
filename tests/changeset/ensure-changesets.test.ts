import * as core from '@actions/core';
import { describe, test, expect, vi, beforeEach } from 'vitest';

import * as changesetsModule from '../../src/changeset/changesets';
import { ensureChangesets } from '../../src/changeset/ensure-changesets';
import * as processChangesModule from '../../src/changeset/process-changes';

describe('ensureChangesets', () => {
  let mockCheckForChangesetFiles: ReturnType<typeof vi.fn>;
  let mockGetChangesetFiles: ReturnType<typeof vi.fn>;
  let mockProcessChanges: ReturnType<typeof vi.fn>;
  let mockInfo: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockCheckForChangesetFiles = vi.fn();
    mockGetChangesetFiles = vi.fn();
    mockProcessChanges = vi.fn();
    mockInfo = vi.fn();
    vi.spyOn(changesetsModule, 'checkForChangesetFiles').mockImplementation(
      mockCheckForChangesetFiles,
    );
    vi.spyOn(changesetsModule, 'getChangesetFiles').mockImplementation(
      mockGetChangesetFiles,
    );
    vi.spyOn(processChangesModule, 'processChanges').mockImplementation(
      mockProcessChanges,
    );
    // @ts-ignore
    core.info = mockInfo;
  });

  test('should be defined', () => {
    expect(typeof ensureChangesets).toBe('function');
  });

  test('should return true and log when changesets exist', async () => {
    mockCheckForChangesetFiles.mockReturnValue(true);
    mockGetChangesetFiles.mockReturnValue(['abc.md', 'def.md']);
    const result = await ensureChangesets();
    expect(result).toBe(true);
    expect(mockInfo).toHaveBeenCalledWith(
      'Existing changesets found. No need to create new ones.\nList of found changeset files: abc.md, def.md',
    );
    expect(mockProcessChanges).not.toHaveBeenCalled();
  });

  test('should create changesets if none exist and return true', async () => {
    mockCheckForChangesetFiles.mockReturnValueOnce(false).mockReturnValueOnce(true);
    mockProcessChanges.mockResolvedValue(undefined);
    const result = await ensureChangesets();
    expect(result).toBe(true);
    expect(mockInfo).toHaveBeenCalledWith(
      'No existing changesets found. Running autopilot to create release notes...',
    );
    expect(mockProcessChanges).toHaveBeenCalled();
  });

  test('should return false and log if no changesets are created', async () => {
    mockCheckForChangesetFiles.mockReturnValue(false);
    mockProcessChanges.mockResolvedValue(undefined);
    const result = await ensureChangesets();
    expect(result).toBe(false);
    expect(mockInfo).toHaveBeenCalledWith(
      'No existing changesets found. Running autopilot to create release notes...',
    );
    expect(mockInfo).toHaveBeenCalledWith('No changes detected that require versioning.');
    expect(mockProcessChanges).toHaveBeenCalled();
  });
});
