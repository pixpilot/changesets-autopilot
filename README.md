# Changeset Autopilot Action

A GitHub Action that automates changeset-based releases with branch-specific configurations, similar to semantic-release. Automatically generates changesets from conventional commits, handles pre-release channels, and publishes to npm.

## Why Automate Changesets?

While we love automation, changesets traditionally follow a more manual approach to package versioning. Semantic-release is renowned for its powerful automation capabilities, but it has one significant limitation: it doesn't support monorepos well out of the box.

There are packages like [`semantic-release-monorepo`](https://www.npmjs.com/package/semantic-release-monorepo) that add monorepo support, but they all miss one crucial feature - **package dependency awareness**. This means they can't properly handle version bumps when packages depend on each other within the same monorepo.

With this action, you get the best of both worlds:

- The **dependency-aware versioning** that changesets provides for monorepos
- The **automated publishing workflow** that semantic-release offers
- **Conventional commit detection** that automatically generates changesets
- **Seamless integration** that auto-merges changes back to your repository

This bridges the gap between manual changeset management and fully automated releases, giving you powerful automation without sacrificing the intelligent dependency handling that makes changesets so valuable for monorepo projects.

## Features

- 🚀 **Automatic changeset generation** from conventional commit messages
- 🌿 **Branch-based release configurations** (main, next, beta, etc.)
- 📦 **Pre-release support** with custom tags (rc, beta, alpha, etc.)
- 🔄 **Automatic versioning and publishing** to npm
- 🤖 **Configurable bot name** for commits

## Quick Start

```yaml
name: Release
on:
  push:
    branches: [main, next]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Release
        uses: pixpilot/changesets-autopilot@v1
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Configuration

### Inputs

| Input            | Description                                                     | Required | Default                |
| ---------------- | --------------------------------------------------------------- | -------- | ---------------------- |
| `GITHUB_TOKEN`   | GitHub token for authentication                                 | ✅       | -                      |
| `NPM_TOKEN`      | NPM token for publishing                                        | ✅       | -                      |
| `BOT_NAME`       | Bot name for commits                                            | ❌       | `changesets-autopilot` |
| `BRANCHES`       | Branch configuration (YAML array)                               | ❌       | See below              |
| `CREATE_RELEASE` | Enable or disable GitHub release creation                       | ❌       | `true`                 |
| `PUSH_TAGS`      | Enable or disable pushing tags to GitHub                        | ❌       | `true`                 |
| `AUTO_CHANGESET` | Enable or disable automatic changeset generation and versioning | ❌       | `true`                 |

**Default BRANCHES configuration:**

```yaml
- main
- name: next
  prerelease: rc
  channel: next
```

### Multi-branch Setup Example

```yaml
- name: Release
  uses: pixpilot/changeset-autopilot@v1
  with:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
    BRANCHES: |
      - main
      - name: next
        prerelease: rc
        channel: next
      - name: beta
        prerelease: beta
        channel: beta
```

This configuration will:

- Release stable versions from `main` branch (e.g., `1.5.0`)
- Release RC versions from `next` branch (e.g., `1.6.0-rc.1`) with `next` tag
- Release beta versions from `beta` branch (e.g., `1.6.0-beta.1`) with `beta` tag

## Supported Commit Types

This action uses [Conventional Commits](https://www.conventionalcommits.org/) to determine version bumps:

### Major Version (Breaking Changes)

- `feat!: redesign user interface`
- `fix(api)!: change response format`
- `BREAKING CHANGE:` in commit body/footer

### Minor Version (New Features)

- `feat: add user dashboard`
- `feat(auth): implement OAuth2`

### Patch Version (Bug Fixes)

- `fix: resolve login bug`
- `perf: optimize queries`
- `revert: undo changes`

### No Version Bump

- `docs:`, `test:`, `chore:`, `ci:`, `build:`, `style:`, `refactor:` (without `!`)

## How It Works

1. **Detects branch** and matches against configuration
2. **Analyzes commits** since last release using conventional commit format
3. **Generates changesets** automatically if none exist
4. **Manages pre-release mode** based on branch settings
5. **Versions packages** using changeset tooling
6. **Publishes to npm** with appropriate dist-tags

## Requirements

- Install @changesets/cli as a dev dependency:
  ```bash
  npm install --save-dev @changesets/cli
  ```
- Changesets initialized in your repository (`npx @changesets/cli init`)
- NPM registry access for publishing

## Troubleshooting

### Pre-release Branch Creation

To avoid issues when creating pre-release branches (e.g., for `rc`, `beta`, or `next` releases):

- **Always pull the latest changes from the main branch first.**
- **Create your pre-release branch from the updated main branch.**
- This ensures your branch is up-to-date and prevents merge conflicts or outdated changesets.

**Recommended workflow:**

```bash
# Update local main branch
git checkout main
git pull origin main

# Create a new pre-release branch from main
git checkout -b next
```

If you encounter issues with publishing or versioning, double-check that your branch is based on the latest main and that all changesets are up-to-date.

## License

MIT License - see [LICENSE](LICENSE) file for details.
