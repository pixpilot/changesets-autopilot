import fs from 'fs';
import path from 'path';

export const changesetDir = path.join(process.cwd(), '.changeset');

/**
 * Returns true if the file is a changeset markdown file (excluding README.md).
 */
export function isChangesetFile(file: string): boolean {
  return file.endsWith('.md') && file !== 'README.md';
}

/**
 * Checks if there are any changeset markdown files (excluding README.md) in the .changeset directory.
 * @returns {boolean} True if there are changesets, false otherwise.
 */
export function checkForChangesetFiles(): boolean {
  if (!fs.existsSync(changesetDir)) return false;
  return fs.readdirSync(changesetDir).some(isChangesetFile);
}

/**
 * Returns the list of changeset markdown files (excluding README.md) in the .changeset directory.
 * @returns {string[]} Array of changeset file names.
 */
export function getChangesetFiles(): string[] {
  if (!fs.existsSync(changesetDir)) return [];
  return fs.readdirSync(changesetDir).filter(isChangesetFile);
}
