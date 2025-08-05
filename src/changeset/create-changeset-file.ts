import fs from 'fs';

export function createChangesetFile(
  packageName: string,
  changeType: string,
  description?: string,
): string {
  const trimmedName = packageName.trim();
  const trimmedDesc = description?.trim() ?? 'No description provided.';
  const changesetContent = `---\n'${trimmedName}': ${changeType}\n---\n${trimmedDesc}\n`;
  const changesetDir = '.changeset';
  if (!fs.existsSync(changesetDir)) {
    fs.mkdirSync(changesetDir);
  }
  const filePath = `${changesetDir}/auto-generated-at-${Date.now()}.md`;
  fs.writeFileSync(filePath, changesetContent);
  return filePath;
}
