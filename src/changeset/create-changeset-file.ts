import fs from 'node:fs';

const CHANGESET_DIR = '.changeset';
const AUTO_GENERATED_PREFIX = 'auto-generated-at-';

let sequence = 0;

/**
 * Builds a unique path for an auto-generated changeset.
 *
 * `Date.now()` on its own is not unique: changesets are written in a tight
 * synchronous loop, so several of them land in the same millisecond and silently
 * overwrite each other, dropping releases for whole packages. A per-process
 * sequence number keeps names distinct within a run, and the existence check
 * guards against collisions with files left over from a previous run.
 */
function getUniqueChangesetPath(changesetDir: string): string {
  const timestamp = Date.now();
  let filePath: string;

  do {
    sequence += 1;
    filePath = `${changesetDir}/${AUTO_GENERATED_PREFIX}${timestamp}-${sequence}.md`;
  } while (fs.existsSync(filePath));

  return filePath;
}

export function createChangesetFile(
  packageName: string,
  changeType: string,
  description?: string,
): string {
  const trimmedName = packageName.trim();
  const trimmedDesc = description?.trim() ?? 'No description provided.';
  const changesetContent = `---\n'${trimmedName}': ${changeType}\n---\n${trimmedDesc}\n`;
  if (!fs.existsSync(CHANGESET_DIR)) {
    fs.mkdirSync(CHANGESET_DIR);
  }
  const filePath = getUniqueChangesetPath(CHANGESET_DIR);
  fs.writeFileSync(filePath, changesetContent);
  return filePath;
}
