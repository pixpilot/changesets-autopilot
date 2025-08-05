# Release Creation Feature

This document demonstrates the new GitHub release creation feature that has been added to the changesets-autopilot action.

## What was added

1. **Modified `publishPackages` function** in `src/publisher/publish-packages.ts`:
   - Now returns an array of `Package` objects representing the packages that were published
   - Detects published packages by comparing package versions before and after the `changeset publish` command
   - Excludes private packages from the returned list

2. **Updated main function** in `src/main.ts`:
   - After publishing packages, creates GitHub releases for each published package
   - Uses the package name and version to create tag names in the format `package-name@version`
   - Reads changelog entries from each package's `CHANGELOG.md` file
   - Creates GitHub releases with the changelog content as the release body
   - Handles prerelease versions (versions containing hyphens) by marking them as prereleases

3. **Added `createRelease` function** in `src/github/create-release.ts`:
   - Takes an Octokit instance, package info, tag name, and repository details
   - Reads the package's CHANGELOG.md file
   - Extracts the changelog entry for the specific version
   - Creates a GitHub release with the extracted changelog content

## How it works

The flow now works as follows:

1. **Version packages**: `changeset version` updates package.json files with new versions
2. **Publish packages**: `changeset publish` publishes packages to npm and creates git tags
3. **Detect published packages**: Compare package versions before/after publish to identify which packages were released
4. **Push tags**: Push the git tags created by changeset to GitHub
5. **Create releases**: For each published package, create a GitHub release using the changelog content

## Example usage

When the action runs and publishes packages, you'll see logs like:

```
Package @my-org/package-a was published with version 1.2.0
Package @my-org/package-b was published with version 0.5.1
Pushing tags created by changeset publish to GitHub...
Tags pushed successfully
Creating GitHub releases for published packages...
Created GitHub release for @my-org/package-a@1.2.0
Created GitHub release for @my-org/package-b@0.5.1
```

The GitHub releases will be created with:

- **Name**: `@my-org/package-a@1.2.0`
- **Tag**: `@my-org/package-a@1.2.0`
- **Body**: The changelog content for version 1.2.0 from the package's CHANGELOG.md
- **Prerelease**: `true` if the version contains a hyphen (e.g., `1.2.0-beta.1`), `false` otherwise

## Requirements

- Each package must have a `CHANGELOG.md` file in its directory
- The changelog must follow a format where versions are marked with headers containing the version number
- The GITHUB_TOKEN must have permissions to create releases in the repository

This feature integrates seamlessly with the existing changesets workflow and provides automatic GitHub release creation for all published packages.
