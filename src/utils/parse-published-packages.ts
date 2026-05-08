// Parses the output from changeset publish to extract published package names
export function parsePublishedPackageNames(publishOutput: string): Set<string> {
  const publishedPackageNames = new Set<string>();
  const lines = publishOutput.split('\n');

  // Look for "New tag:" lines which indicate a package was published (monorepo format)
  const newTagRegex = /New tag:\s+(?<package>@[^/\s]+\/[^@\s]+|[^@\s]+)@\S+/u;

  // Look for published packages in success output (e.g., "🦋  @pixpilot/p11@0.0.1")
  const publishedPackageRegex = /🦋\s+(?<package>@[^/\s]+\/[^@\s]+|[^@\s]+)@\S+$/u;

  // Look for packages being published in info lines (e.g., '🦋  info Publishing "@scope/package" at "1.0.0"')
  const publishingInfoRegex =
    /🦋\s+info\s+Publishing\s+"(?<package>@[^/]+\/[^"]+|[^"]+)"\s+at\s+"[^"]+"/u;

  for (const line of lines) {
    // Check for package@version tags first (traditional monorepo format)
    const tagMatch = newTagRegex.exec(line);
    const tagPackage = tagMatch?.groups?.package;
    if (typeof tagPackage === 'string' && tagPackage.length > 0) {
      const pkgName = tagPackage;
      publishedPackageNames.add(pkgName);
    } else {
      // Check for published packages in success output
      const publishedMatch = publishedPackageRegex.exec(line);
      const publishedPackage = publishedMatch?.groups?.package;
      if (typeof publishedPackage === 'string' && publishedPackage.length > 0) {
        const pkgName = publishedPackage;
        publishedPackageNames.add(pkgName);
      } else {
        // Check for packages being published in info lines
        const publishingMatch = publishingInfoRegex.exec(line);
        const publishingPackage = publishingMatch?.groups?.package;
        if (typeof publishingPackage === 'string' && publishingPackage.length > 0) {
          const pkgName = publishingPackage;
          publishedPackageNames.add(pkgName);
        }
      }
    }
  }

  return publishedPackageNames;
}
