import fs from 'fs';
import path from 'path';

export const changesetDir = path.join(process.cwd(), '.changeset');

/**
 * Returns true if the file is a changeset markdown file (excluding README.md and auto-generated files).
 */
export function isChangesetFile(file: string): boolean {
  return (
    file.endsWith('.md') && file !== 'README.md' && !file.startsWith('auto-generated-at-')
  );
}

/**
 * Returns true if the file is any changeset markdown file (including auto-generated ones, excluding README.md).
 */
export function isAnyChangesetFile(file: string): boolean {
  return file.endsWith('.md') && file !== 'README.md';
}

/**
 * Checks if there are any manual changeset markdown files (excluding README.md and auto-generated files) in the .changeset directory.
 * @returns {boolean} True if there are manual changesets, false otherwise.
 */
export function checkForChangesetFiles(): boolean {
  if (!fs.existsSync(changesetDir)) return false;
  return fs.readdirSync(changesetDir).some(isChangesetFile);
}

/**
 * Returns the list of manual changeset markdown files (excluding README.md and auto-generated files) in the .changeset directory.
 * @returns {string[]} Array of manual changeset file names.
 */
export function getChangesetFiles(): string[] {
  if (!fs.existsSync(changesetDir)) return [];
  return fs.readdirSync(changesetDir).filter(isChangesetFile);
}

/**
 * Returns the list of all changeset markdown files (including auto-generated ones, excluding README.md) in the .changeset directory.
 * @returns {string[]} Array of all changeset file names.
 */
export function getAllChangesetFiles(): string[] {
  if (!fs.existsSync(changesetDir)) return [];
  return fs.readdirSync(changesetDir).filter(isAnyChangesetFile);
}
