/**
 * Extract git tags from refs string
 * @param refsString - The refs string from git log
 * @return Array of tag names
 */
export function extractGitTags(refsString: string): string[] {
  if (!refsString) return [];
  const tagRegex = /tag: ([^,)]+)/g;
  const tags: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(refsString)) !== null) {
    tags.push(match[1].trim());
  }
  return tags;
}
