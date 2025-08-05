# GitHub Release Creation Feature

## Overview

This project now automatically creates GitHub releases for packages that are published via changeset. The feature was implemented by improving the `publishPackages` function to return information about which packages were actually published, and then creating GitHub releases for those packages.

## Implementation Details

### Package Detection Strategy

We use a reliable approach based on the official changesets action to detect which packages were published:

1. **Parse "New tag" output**: When `changeset publish` runs, it outputs lines like `🦋  New tag:  package-name@version` for each published package
2. **Regex pattern**: We use `/New tag:\s+(@[^/]+\/[^@]+|[^/]+)@([^\s]+)/` to extract package names and versions
3. **Filter private packages**: We exclude any packages marked as `private: true` in their package.json

### Code Changes

#### `src/publisher/publish-packages.ts`

- Modified to be `async` and return `Package[]` instead of `void`
- Uses `execSync` to capture changeset publish output
- Parses output for "New tag:" lines to identify published packages
- Filters out private packages from the results

#### `src/main.ts`

- Updated to handle async `publishPackages`
- Creates GitHub releases for each published package using `Promise.all`
- Includes proper error handling with warnings if release creation fails
- Uses the pattern: `${pkg.packageJson.name}@${pkg.packageJson.version}` for tag names

#### `src/github/create-release.ts`

- Pre-existing function that creates releases by reading CHANGELOG.md
- Handles both regular and pre-release versions
- Extracts changelog content for the specific version

### Testing

All functionality is covered by tests:

- `tests/publisher/publish-packages.test.ts`: Tests package detection logic
- `tests/github/create-release.test.ts`: Tests release creation functionality
- Both test suites pass successfully

### Usage Flow

1. **Version**: `changeset version` updates package versions and CHANGELOGs
2. **Git Operations**: Commit and push the version changes
3. **Publish**: `changeset publish` publishes packages to npm and creates git tags
4. **Tag Push**: Push the created tags to GitHub
5. **Release Creation**: Create GitHub releases for each published package using their CHANGELOG content

## Benefits

- **Automatic**: No manual intervention needed to create releases
- **Reliable**: Uses the same detection method as the official changesets action
- **Comprehensive**: Creates releases for all published packages
- **Error Tolerant**: If release creation fails for one package, others still get processed
- **Changelog Integration**: Uses existing CHANGELOG.md content for release descriptions

## Example Output

When packages are published, you'll see logs like:

```
Creating GitHub releases for published packages...
Created GitHub release for @my-org/package-a@1.2.0
Created GitHub release for package-b@2.1.0
```

If no packages are published:

```
No packages were published, skipping release creation
```

- **Name**: `@my-org/package-a@1.2.0`
- **Tag**: `@my-org/package-a@1.2.0`
- **Body**: The changelog content for version 1.2.0 from the package's CHANGELOG.md
- **Prerelease**: `true` if the version contains a hyphen (e.g., `1.2.0-beta.1`), `false` otherwise

## Requirements

- Each package must have a `CHANGELOG.md` file in its directory
- The changelog must follow a format where versions are marked with headers containing the version number
- The GITHUB_TOKEN must have permissions to create releases in the repository

This feature integrates seamlessly with the existing changesets workflow and provides automatic GitHub release creation for all published packages.
