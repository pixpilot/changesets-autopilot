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
