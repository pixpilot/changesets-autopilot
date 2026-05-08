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
```

## Configuration

### Inputs

| Input            | Description                                                                          | Required | Default                |
| ---------------- | ------------------------------------------------------------------------------------ | -------- | ---------------------- |
| `GITHUB_TOKEN`   | GitHub token for authentication                                                      | ✅       | -                      |
| `NPM_TOKEN`      | NPM token for publishing (optional when using npm Trusted Publisher / OIDC)          | ❌       | -                      |
| `provenance`     | Enable npm provenance attestation                                                    | ❌       | `false`                |
| `BOT_NAME`       | Bot name for commits                                                                 | ❌       | `changesets-autopilot` |
| `BRANCHES`       | Branch configuration (YAML array)                                                    | ❌       | See below              |
| `CREATE_RELEASE` | Enable or disable GitHub release creation                                            | ❌       | `true`                 |
| `PUSH_TAGS`      | Enable or disable pushing tags to GitHub (disabling this will also prevent releases) | ❌       | `true`                 |
| `AUTO_CHANGESET` | Enable or disable automatic changeset generation and versioning                      | ❌       | `true`                 |

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

### npm Trusted Publisher (OIDC) (Recommended)

You can publish to npm without storing `NPM_TOKEN` by using npm Trusted Publisher with GitHub OIDC.

Required workflow permissions:

```yaml
permissions:
  contents: write
  id-token: write
```

OIDC workflow example (no `NPM_TOKEN`):

```yaml
name: Release
on:
  push:
    branches: [main, next]

permissions:
  contents: write
  id-token: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci

      - name: Release
        uses: pixpilot/changesets-autopilot@v1
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          provenance: 'true'
```

Backward-compatible token workflow example:

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

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci

      - name: Release
        uses: pixpilot/changesets-autopilot@v1
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          provenance: 'true'
```

### npm Provenance Attestation

The `provenance` input is an explicit feature flag. It is independent from how you authenticate to npm.

- `provenance: 'true'` enables npm provenance attestation
- `provenance: 'false'` disables provenance attestation
- You can combine it with either `NPM_TOKEN` or npm Trusted Publisher (OIDC)

If you want npm provenance in your release workflow, set:

```yaml
with:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  provenance: 'true'
```

If you are using OIDC Trusted Publisher, keep the required permissions from the OIDC section and add `provenance: 'true'` in the action inputs.

### Migration from `NPM_TOKEN` to OIDC

1. Configure npm Trusted Publisher for your package/repository in npm settings.
2. Add `permissions.id-token: write` to your release workflow.
3. Remove `NPM_TOKEN` from workflow inputs and secrets.
4. Keep `GITHUB_TOKEN` as-is.

The action will automatically choose auth mode:

- With `NPM_TOKEN`: token mode
- Without `NPM_TOKEN`: OIDC trusted publisher mode

The action will only enable provenance when you explicitly set `provenance: 'true'`.

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
3. **Generates changesets** automatically
4. **Manages pre-release mode** based on branch settings
5. **Versions packages** using changeset tooling
6. **Publishes to npm** with appropriate dist-tags

## Requirements

- Install @changesets/cli as a dev dependency:
  ```bash
  npm install --save-dev @changesets/cli
  ```
- Changesets initialized in your repository (`npx @changesets/cli init`)
- NPM registry access for publishing (via `NPM_TOKEN` or npm Trusted Publisher)

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

### Concurrent Push Race Condition

**Problem:** When pushing multiple commits rapidly or triggering multiple workflow runs in quick succession, you may encounter errors like:

```
Package is not being published because version X.X.X is already published on npm
```

**Why this happens:** The action determines the next version by checking the last release details from the repository. If multiple workflow runs execute simultaneously or in quick succession, they may both read the same "last release" state before either has completed publishing and pushed the updated version tags back to the repository. This causes both runs to attempt publishing the same version number.

**Workarounds:**

- **Wait for completion**: Ensure each workflow run completes fully before pushing new commits.
- **Use concurrency controls**: Add concurrency settings to your workflow to prevent parallel runs:

```yaml
concurrency:
  group: release-${{ github.ref }}
  cancel-in-progress: false
```

- **Manual intervention**: If a duplicate version error occurs, the subsequent run should detect the published version and proceed with the correct next version.

**Note:** This is a known timing issue that occurs when the repository state hasn't been updated before a new workflow begins. Future versions may include better synchronization mechanisms. In the meantime, using concurrency controls and ensuring sequential workflow runs can help mitigate this issue.

## License

MIT License - see [LICENSE](LICENSE) file for details.
