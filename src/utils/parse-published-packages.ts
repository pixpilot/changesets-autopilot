// Parses the output from changeset publish to extract published package names
export function parsePublishedPackageNames(publishOutput: string): Set<string> {
  const publishedPackageNames = new Set<string>();
  const lines = publishOutput.split('\n');

  // Look for "New tag:" lines which indicate a package was published (monorepo format)
  const newTagRegex = /New tag:\s+(@[^/]+\/[^@\s]+|[^@\s]+)@([^\s]+)/;

  // Look for published packages in success output (e.g., "🦋  @pixpilot/p11@0.0.1")
  const publishedPackageRegex = /🦋\s+(@[^/]+\/[^@\s]+|[^@\s]+)@([^\s]+)$/;

  // Look for packages being published in info lines (e.g., '🦋  info Publishing "@scope/package" at "1.0.0"')
  const publishingInfoRegex =
    /🦋\s+info\s+Publishing\s+"(@[^/]+\/[^"]+|[^"]+)"\s+at\s+"([^"]+)"/;

  for (const line of lines) {
    // Check for package@version tags first (traditional monorepo format)
    const tagMatch = newTagRegex.exec(line);
    if (tagMatch) {
      const pkgName = tagMatch[1];
      publishedPackageNames.add(pkgName);
      continue;
    }

    // Check for published packages in success output
    const publishedMatch = publishedPackageRegex.exec(line);
    if (publishedMatch) {
      const pkgName = publishedMatch[1];
      publishedPackageNames.add(pkgName);
      continue;
    }

    // Check for packages being published in info lines
    const publishingMatch = publishingInfoRegex.exec(line);
    if (publishingMatch) {
      const pkgName = publishingMatch[1];
      publishedPackageNames.add(pkgName);
    }
  }

  return publishedPackageNames;
}
