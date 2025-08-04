# Changeset Autopilot Action

[![GitHub Super-Linter](https://github.com/pixpilot/changeset-autopilot/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/pixpilot/changeset-autopilot/actions/workflows/ci.yml/badge.svg)

A GitHub Action that automates changeset-based releases with branch-specific configurations, similar to semantic-release. Automatically generates changesets from conventional commits, handles pre-release channels, and publishes to npm.

## Features

- 🚀 **Automatic changeset generation** from conventional commit messages
- 🌿 **Branch-based release configurations** (main, next, beta, etc.)
- 📦 **Pre-release support** with custom tags (rc, beta, alpha, etc.)
- 🔄 **Automatic versioning and publishing** to npm
- 🤖 **Configurable bot name** for commits

## Quick Start

````yaml
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
        uses: pixpilot/changeset-autopilot@v1
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```## Configuration

### Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `GITHUB_TOKEN` | GitHub token for authentication | ✅ | - |
| `NPM_TOKEN` | NPM token for publishing | ✅ | - |
| `BOT_NAME` | Bot name for commits | ❌ | `changesets-autopilot` |
| `BRANCHES` | Branch configuration (YAML array) | ❌ | See below |

**Default BRANCHES configuration:**
```yaml
- main
- name: next
  prerelease: rc
  channel: next
````

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

- Node.js 20+
- Changesets initialized in your repository (`npx @changesets/cli init`)
- NPM registry access for publishing

## Development

### Setup

```bash
npm install
npm test
npm run bundle
```

### Local Testing

```bash
npx @github/local-action . src/index.ts .env
```

## License

MIT License - see [LICENSE](LICENSE) file for details.
