import fs from 'node:fs';
import path from 'node:path';

import { parse } from 'yaml';
import { describe, expect, test } from 'vitest';

interface WorkflowDefinition {
  on?: unknown;
}

const workflowsDirectory = path.resolve(process.cwd(), '.github', 'workflows');
const workflowFilePattern = /\.ya?ml$/;
const skipMarkerPattern = /\[(skip ci|ci skip)\]/i;
const skipGuardPatternSkipCi =
  /contains\(\s*(github\.event\.head_commit\.message|toJson\(github\.event\))\s*,\s*['"]\[skip ci\]['"]\s*\)/i;
const skipGuardPatternCiSkip =
  /contains\(\s*(github\.event\.head_commit\.message|toJson\(github\.event\))\s*,\s*['"]\[ci skip\]['"]\s*\)/i;

function hasTrigger(eventConfig: unknown, trigger: 'push' | 'pull_request'): boolean {
  if (typeof eventConfig === 'string') {
    return eventConfig === trigger;
  }

  if (Array.isArray(eventConfig)) {
    return eventConfig.includes(trigger);
  }

  if (eventConfig && typeof eventConfig === 'object') {
    return Object.prototype.hasOwnProperty.call(eventConfig, trigger);
  }

  return false;
}

function isPushOrPullRequestWorkflow(workflow: WorkflowDefinition): boolean {
  return hasTrigger(workflow.on, 'push') || hasTrigger(workflow.on, 'pull_request');
}

describe('workflow skip-ci guards', () => {
  test('should ensure all push/pull_request workflows include an explicit skip-ci guard', () => {
    const workflowFiles = fs
      .readdirSync(workflowsDirectory)
      .filter((filename) => workflowFilePattern.test(filename));

    const missingGuard: string[] = [];

    for (const workflowFile of workflowFiles) {
      const workflowPath = path.join(workflowsDirectory, workflowFile);
      const workflowContent = fs.readFileSync(workflowPath, 'utf8');
      const workflow = parse(workflowContent) as WorkflowDefinition;

      if (!isPushOrPullRequestWorkflow(workflow)) {
        continue;
      }

      const hasSkipMarker = skipMarkerPattern.test(workflowContent);
      const hasSkipGuard =
        skipGuardPatternSkipCi.test(workflowContent) &&
        skipGuardPatternCiSkip.test(workflowContent);

      if (!hasSkipMarker || !hasSkipGuard) {
        missingGuard.push(workflowFile);
      }
    }

    expect(
      missingGuard,
      `These workflows are missing an explicit [skip ci]/[ci skip] guard: ${missingGuard.join(', ')}`,
    ).toEqual([]);
  });
});
