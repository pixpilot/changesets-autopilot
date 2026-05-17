## [1.5.4](https://github.com/pixpilot/changesets-autopilot/compare/v1.5.3...v1.5.4) (2026-05-17)


### Bug Fixes

* improve error handling in git operations and publishing logic ([c9a7563](https://github.com/pixpilot/changesets-autopilot/commit/c9a756378a9a4c4d2f5a70d9bcc23e1dd2c2ed9a))

## [1.5.3](https://github.com/pixpilot/changesets-autopilot/compare/v1.5.2...v1.5.3) (2026-05-12)


### Bug Fixes

* **config:** update default branch behavior and improve fallback logic ([3c9a0a5](https://github.com/pixpilot/changesets-autopilot/commit/3c9a0a53af006bf9135c361613ed16b2ecb50ef3))

## [1.5.2](https://github.com/pixpilot/changesets-autopilot/compare/v1.5.1...v1.5.2) (2026-05-09)


### Bug Fixes

* **scripts:** simplify bundle command in package.json ([d962c13](https://github.com/pixpilot/changesets-autopilot/commit/d962c13d0c09c817b34a039983e9823ca34c8846))

## [1.5.1](https://github.com/pixpilot/changesets-autopilot/compare/v1.5.0...v1.5.1) (2026-05-09)


### Bug Fixes

* **release:** update create-github-app-token action to v3 ([ecbd84d](https://github.com/pixpilot/changesets-autopilot/commit/ecbd84de2ce7450fe0ad9cdcaa3dccdc2f31a442))

# [1.5.0](https://github.com/pixpilot/changesets-autopilot/compare/v1.4.5...v1.5.0) (2026-05-09)


### Features

* **log:** implement logging utility with message prefixing ([c7fe97d](https://github.com/pixpilot/changesets-autopilot/commit/c7fe97d69ffd499d81f5e5d34fad33e341d3f590))
* **log:** integrate @changesets/logger for enhanced logging ([37d7542](https://github.com/pixpilot/changesets-autopilot/commit/37d75428d98bf9a39851d0a7f4509b25575a27fd))

## [1.4.5](https://github.com/pixpilot/changesets-autopilot/compare/v1.4.4...v1.4.5) (2026-05-08)


### Bug Fixes

* **log:** correct CHANGESET_MESSAGE_PREFIX character ([bbf1455](https://github.com/pixpilot/changesets-autopilot/commit/bbf1455f597b41a327e1222832553debb3c8bab7))
* **log:** update message prefix characters for consistency ([6fc30fe](https://github.com/pixpilot/changesets-autopilot/commit/6fc30fe2087d3ecba25c1160a06eee86b5bf2102))

## [1.4.4](https://github.com/pixpilot/changesets-autopilot/compare/v1.4.3...v1.4.4) (2026-05-08)


### Bug Fixes

* **git:** enhance fallback logic for last published commit retrieval ([743b3ab](https://github.com/pixpilot/changesets-autopilot/commit/743b3aba8a4c465d05221e630b06ca0b1d624203))

## [1.4.3](https://github.com/pixpilot/changesets-autopilot/compare/v1.4.2...v1.4.3) (2026-05-08)


### Bug Fixes

* **log:** integrate message prefixing directly into log utility ([5798878](https://github.com/pixpilot/changesets-autopilot/commit/579887835a6cf2af9991e2d8922006cd69f8fdb7))

## [1.4.2](https://github.com/pixpilot/changesets-autopilot/compare/v1.4.1...v1.4.2) (2026-05-08)


### Bug Fixes

* **validate-oidc-node-runtime:** improve error message for Node.js version compatibility ([6916d9e](https://github.com/pixpilot/changesets-autopilot/commit/6916d9e867e1e0ca18e07c6f7c9a4fae5a7a1832))

## [1.4.1](https://github.com/pixpilot/changesets-autopilot/compare/v1.4.0...v1.4.1) (2026-05-08)


### Bug Fixes

* **husky:** remove build step from pre-commit hook ([795f88c](https://github.com/pixpilot/changesets-autopilot/commit/795f88c42b4d4aa61a3350ca1f1fda7bd02bd598))

# [1.4.0](https://github.com/pixpilot/changesets-autopilot/compare/v1.3.1...v1.4.0) (2026-05-08)


### Bug Fixes

* **oidc:** require node 24+ for trusted publishing ([2989a74](https://github.com/pixpilot/changesets-autopilot/commit/2989a74a34a6a97834023b3dcabbf17dff960228))


### Features

* **ci:** add setup and build steps to CI workflow ([33a3c1f](https://github.com/pixpilot/changesets-autopilot/commit/33a3c1f51de6273330e04de68497434a6d1fe9c4))
* **core:** add message prefixing and OIDC node version validation ([dcbe185](https://github.com/pixpilot/changesets-autopilot/commit/dcbe1856d6f311ee7cd315161167314cd7b203fb))
* **core:** enhance message prefixing for read-only methods ([0a23364](https://github.com/pixpilot/changesets-autopilot/commit/0a23364bfa3a7e3bb53f6bd2abfd75cab435ddd7))

## [1.3.1](https://github.com/pixpilot/changesets-autopilot/compare/v1.3.0...v1.3.1) (2026-05-08)


### Bug Fixes

* **publish-packages:** clear NODE_AUTH_TOKEN/NPM_TOKEN in OIDC mode ([c548641](https://github.com/pixpilot/changesets-autopilot/commit/c5486415a7a6c31d30c6dfe81b5cf0c47843d84a))

# [1.3.0](https://github.com/pixpilot/changesets-autopilot/compare/v1.2.1...v1.3.0) (2026-05-08)


### Bug Fixes

* **docs:** update README for clarity on workflow completion ([277939e](https://github.com/pixpilot/changesets-autopilot/commit/277939e5528b7b70f0e219612fa15c3423ff99e3))
* **package:** add packageManager field to specify pnpm version ([5773b86](https://github.com/pixpilot/changesets-autopilot/commit/5773b8634b5dfc18e969925f048f9ef4fc750475))
* **parsePublishedPackages:** remove redundant comment ([cc8cf09](https://github.com/pixpilot/changesets-autopilot/commit/cc8cf09fa026cb21c872fc945aa0e3b0b301a164))
* **release:** harden release commit parsing ([a80a930](https://github.com/pixpilot/changesets-autopilot/commit/a80a9309f799ee907061d576fdec49fe4534c3b7))
* remove lock npm file ([27afb12](https://github.com/pixpilot/changesets-autopilot/commit/27afb12abd0ef94128dcb4ed68d7b203ee3d857c))
* Update README.md ([#25](https://github.com/pixpilot/changesets-autopilot/issues/25)) ([ba501fa](https://github.com/pixpilot/changesets-autopilot/commit/ba501fa3fbf0b8149146be4a0bb9b74631a1f8d9))


### Features

* **tests:** enhance test coverage and improve mocking for GitHub actions ([56702bf](https://github.com/pixpilot/changesets-autopilot/commit/56702bff0cb62bb795da808ee584acb00c6d1887))

## [1.2.1](https://github.com/pixpilot/changesets-autopilot/compare/v1.2.0...v1.2.1) (2026-05-08)


### Bug Fixes

* **workflows:** improve clarity of skip-ci guard test description ([0324948](https://github.com/pixpilot/changesets-autopilot/commit/03249489a07583681f5273e87136d134db0e4241))

# [1.2.0](https://github.com/pixpilot/changesets-autopilot/compare/v1.1.3...v1.2.0) (2026-05-08)


### Bug Fixes

* **workflows:** improve skip CI guards and release conditions ([f2e15f8](https://github.com/pixpilot/changesets-autopilot/commit/f2e15f88cdd1f3e0b0c9fb898e3334ec47db5437))
* **workflows:** improve skip CI guards formatting ([e936f08](https://github.com/pixpilot/changesets-autopilot/commit/e936f08cf1688f00f3486637d4a1ea60154186d9))
* **workflows:** remove unnecessary blank lines in CI and linter workflows ([4a1a585](https://github.com/pixpilot/changesets-autopilot/commit/4a1a58510fb6a5dd942ae5447407a2841edfda1b))
* **workflows:** standardize quotes in workflow files ([defac53](https://github.com/pixpilot/changesets-autopilot/commit/defac53825fcdcfc1a670ca6af854b9e5e4f56af))
* **workflows:** update token generation for release job ([712d9ab](https://github.com/pixpilot/changesets-autopilot/commit/712d9ab244c9c35087f73c4ad2c7a78081dbcde2))


### Features

* **ci:** enhance CI workflows with skip-ci guards ([e3a0bfa](https://github.com/pixpilot/changesets-autopilot/commit/e3a0bfa782b52c588ddad3ef2cad897402f37f5e))
