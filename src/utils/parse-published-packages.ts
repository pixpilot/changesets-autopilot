// Parses the output from changeset publish to extract published package names
export function parsePublishedPackageNames(publishOutput: string): Set<string> {
  const publishedPackageNames = new Set<string>();
  const lines = publishOutput.split('\n');

  // Look for "New tag:" lines which indicate a package was published
  const newTagRegex = /New tag:\s+(@[^/]+\/[^@]+|[^/]+)@([^\s]+)/;

  for (const line of lines) {
    const match = newTagRegex.exec(line);
    if (match) {
      const pkgName = match[1];
      publishedPackageNames.add(pkgName);
    }
  }

  return publishedPackageNames;
}
