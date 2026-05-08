import type { MockedFunction } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock all external dependencies
vi.mock('@actions/core');
vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn(() => ({
    repos: {
      createRelease: vi.fn(),
    },
  })),
}));
vi.mock('fs', () => ({ default: { existsSync: vi.fn() } }));
vi.mock('child_process', () => ({ execSync: vi.fn() }));
vi.mock('simple-git', () => ({ default: vi.fn(() => ({ addConfig: vi.fn() })) }));

// Mock internal modules
vi.mock('../src/config/get-action-inputs');
vi.mock('../src/config/get-branch-config');
vi.mock('../src/config/validate-branch-configuration');
vi.mock('../src/git/configure-git');
vi.mock('../src/changeset/ensure-changesets-available');
vi.mock('../src/changeset/configure-rerelease-mode');
vi.mock('../src/changeset/create-changesets-for-recent-commits');
vi.mock('../src/changeset/run-changeset-version');
vi.mock('../src/changeset/changesets');
vi.mock('../src/git/commit-and-push');
vi.mock('../src/changeset/publish-packages');
vi.mock('../src/github/create-releases-for-packages');
vi.mock('../src/github/push-changeset-tags');

describe('main.js', () => {
  let mockGetActionInputs: MockedFunction<any>;
  let mockGetBranchConfig: MockedFunction<any>;
  let mockValidateBranchConfiguration: MockedFunction<any>;
  let mockConfigureGit: MockedFunction<any>;
  let mockEnsureChangesetsAvailable: MockedFunction<any>;
  let mockConfigureRereleaseMode: MockedFunction<any>;
  let mockCreateChangesetsForRecentCommits: MockedFunction<any>;
  let mockRunChangesetVersion: MockedFunction<any>;
  let mockHasChangesetFiles: MockedFunction<any>;
  let mockCommitAndPush: MockedFunction<any>;
  let mockPublishPackages: MockedFunction<any>;
  let mockCreateReleasesForPackages: MockedFunction<any>;
  let mockPushChangesetTags: MockedFunction<any>;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    // Setup default mocks
    const getActionInputsModule = await import('../src/config/get-action-inputs');
    const getBranchConfigModule = await import('../src/config/get-branch-config');
    const validateBranchConfigurationModule =
      await import('../src/config/validate-branch-configuration');
    const configureGitModule = await import('../src/git/configure-git');
    const ensureChangesetsAvailableModule =
      await import('../src/changeset/ensure-changesets-available');
    const configureRereleaseModeModule =
      await import('../src/changeset/configure-rerelease-mode');
    const createChangesetsForRecentCommitsModule =
      await import('../src/changeset/create-changesets-for-recent-commits');
    const runChangesetVersionModule =
      await import('../src/changeset/run-changeset-version');
    const changesetsModule = await import('../src/changeset/changesets');
    const commitAndPushModule = await import('../src/git/commit-and-push');
    const publishPackagesModule = await import('../src/changeset/publish-packages');
    const createReleasesForPackagesModule =
      await import('../src/github/create-releases-for-packages');
    const pushChangesetTagsModule = await import('../src/github/push-changeset-tags');

    mockGetActionInputs = vi.mocked(getActionInputsModule.getActionInputs);
    mockGetBranchConfig = vi.mocked(getBranchConfigModule.getBranchConfig);
    mockValidateBranchConfiguration = vi.mocked(
      validateBranchConfigurationModule.validateBranchConfiguration,
    );
    mockConfigureGit = vi.mocked(configureGitModule.configureGit);
    mockEnsureChangesetsAvailable = vi.mocked(
      ensureChangesetsAvailableModule.ensureChangesetsAvailable,
    );
    mockConfigureRereleaseMode = vi.mocked(
      configureRereleaseModeModule.configureRereleaseMode,
    );
    mockCreateChangesetsForRecentCommits = vi.mocked(
      createChangesetsForRecentCommitsModule.createChangesetsForRecentCommits,
    );
    mockRunChangesetVersion = vi.mocked(runChangesetVersionModule.runChangesetVersion);
    mockHasChangesetFiles = vi.mocked(changesetsModule.hasChangesetFiles);
    mockCommitAndPush = vi.mocked(commitAndPushModule.commitAndPush);
    mockPublishPackages = vi.mocked(publishPackagesModule.publishPackages);
    mockCreateReleasesForPackages = vi.mocked(
      createReleasesForPackagesModule.createReleasesForPackages,
    );
    mockPushChangesetTags = vi.mocked(pushChangesetTagsModule.pushChangesetTags);

    // Default return values
    mockGetActionInputs.mockReturnValue({
      githubToken: 'test-token',
      npmToken: 'test-npm-token',
      botName: 'test-bot',
      branches: ['main'],
    });
    mockGetBranchConfig.mockReturnValue({ name: 'main', isMatch: true });
    mockValidateBranchConfiguration.mockReturnValue(true);
    mockConfigureGit.mockResolvedValue({
      addConfig: vi.fn(),
      pushTags: vi.fn().mockResolvedValue(undefined),
    });
    mockEnsureChangesetsAvailable.mockReturnValue(undefined);
    mockConfigureRereleaseMode.mockReturnValue(undefined);
    mockCreateChangesetsForRecentCommits.mockResolvedValue(undefined);
    mockRunChangesetVersion.mockReturnValue(undefined);
    mockHasChangesetFiles.mockReturnValue(true);
    mockCommitAndPush.mockResolvedValue(undefined);
    mockPublishPackages.mockResolvedValue([]);
    mockCreateReleasesForPackages.mockResolvedValue(undefined);
    mockPushChangesetTags.mockResolvedValue(undefined);

    process.env.GITHUB_REF_NAME = 'main';
    process.env.GITHUB_REPOSITORY = 'owner/repo';
  });

  afterEach(() => {
    delete process.env.GITHUB_REF_NAME;
    delete process.env.GITHUB_REPOSITORY;
  });

  it('should skip processing for unconfigured branch', async () => {
    mockValidateBranchConfiguration.mockReturnValue(false);

    const { run } = await import('../src/main');
    await run();

    expect(mockValidateBranchConfiguration).toHaveBeenCalled();
    expect(mockHasChangesetFiles).not.toHaveBeenCalled();
  });

  it('handles errors correctly', async () => {
    const error = new Error('Test error');
    mockGetActionInputs.mockImplementation(() => {
      throw error;
    });

    const { run } = await import('../src/main');
    await run();

    // Just verify the function was called since we mocked the implementation
    expect(mockGetActionInputs).toHaveBeenCalled();
  });

  it('should process release with changesets and npm token', async () => {
    mockHasChangesetFiles.mockReturnValue(true);

    const { run } = await import('../src/main');
    await run();

    expect(mockCommitAndPush).toHaveBeenCalled();
    expect(mockPublishPackages).toHaveBeenCalledWith(
      expect.any(Object),
      'test-npm-token',
      false,
    );
  });

  it('should process release with no changesets', async () => {
    mockHasChangesetFiles.mockReturnValue(false);

    const { run } = await import('../src/main');
    await run();

    expect(mockCommitAndPush).not.toHaveBeenCalled();
    expect(mockPublishPackages).not.toHaveBeenCalled();
  });

  it('should use OIDC publish mode if npm token is missing', async () => {
    mockGetActionInputs.mockReturnValue({
      githubToken: 'test-token',
      npmToken: undefined,
      botName: 'test-bot',
      branches: ['main'],
    });
    mockHasChangesetFiles.mockReturnValue(true);

    const { run } = await import('../src/main');
    await run();

    expect(mockCommitAndPush).toHaveBeenCalled();
    expect(mockPublishPackages).toHaveBeenCalledWith(
      expect.any(Object),
      undefined,
      false,
    );
  });

  it('should pass provenance=true to publishPackages when provenance input is true', async () => {
    const coreModule = await import('@actions/core');
    const mockCoreGetInput = vi.spyOn(coreModule, 'getInput');
    mockCoreGetInput.mockImplementation((name: string) => {
      if (name === 'provenance') {
        return 'true';
      }
      return '';
    });

    mockHasChangesetFiles.mockReturnValue(true);

    const { run } = await import('../src/main');
    await run();

    expect(mockPublishPackages).toHaveBeenCalledWith(
      expect.any(Object),
      'test-npm-token',
      true,
    );
  });

  it('should configure prerelease mode for prerelease branch', async () => {
    const prereleaseConfig = {
      name: 'next',
      prerelease: 'rc',
      channel: 'next',
      isMatch: true,
    };
    mockGetBranchConfig.mockReturnValue(prereleaseConfig);
    mockHasChangesetFiles.mockReturnValue(false);

    const { run } = await import('../src/main');
    await run();

    expect(mockConfigureRereleaseMode).toHaveBeenCalledWith(prereleaseConfig);
  });

  it('should call core.setFailed if an error is thrown', async () => {
    const coreModule = await import('@actions/core');
    const mockSetFailed = vi.spyOn(coreModule, 'setFailed');
    mockGetActionInputs.mockImplementation(() => {
      throw new Error('fail');
    });
    const { run } = await import('../src/main');
    await run();
    expect(mockSetFailed).toHaveBeenCalledWith(
      expect.stringContaining('Action failed: fail'),
    );
  });

  it('should log info if no changesets to process', async () => {
    const coreModule = await import('@actions/core');
    const mockInfo = vi.spyOn(coreModule, 'info');
    mockHasChangesetFiles.mockReturnValue(false);
    const { run } = await import('../src/main');
    await run();
    expect(mockInfo).toHaveBeenCalledWith('No changesets to process. Action completed.');
  });

  it('should log OIDC mode info if no npm token provided', async () => {
    const coreModule = await import('@actions/core');
    const mockInfo = vi.spyOn(coreModule, 'info');
    mockGetActionInputs.mockReturnValue({
      githubToken: 'test-token',
      npmToken: undefined,
      botName: 'test-bot',
      branches: ['main'],
    });
    mockHasChangesetFiles.mockReturnValue(true);
    const { run } = await import('../src/main');
    await run();
    expect(mockInfo).toHaveBeenCalledWith(
      'Using npm authentication mode: OIDC trusted publisher mode',
    );
  });

  it('should call core.warning if pushChangesetTags throws', async () => {
    const coreModule = await import('@actions/core');
    const mockWarning = vi.spyOn(coreModule, 'warning');
    mockHasChangesetFiles.mockReturnValue(true);
    mockGetActionInputs.mockReturnValue({
      githubToken: 'test-token',
      npmToken: 'test-npm-token',
      botName: 'test-bot',
      branches: ['main'],
      pushTags: true,
      createRelease: true,
    });
    mockPublishPackages.mockResolvedValue(['pkg']);
    mockPushChangesetTags.mockRejectedValue(new Error('tag error'));
    const { run } = await import('../src/main');
    await run();
    expect(mockWarning).toHaveBeenCalledWith('Failed to push tags: Error: tag error');
  });

  it('should call createReleasesForPackages if releasedPackages and shouldCreateRelease', async () => {
    mockHasChangesetFiles.mockReturnValue(true);
    mockGetActionInputs.mockReturnValue({
      githubToken: 'test-token',
      npmToken: 'test-npm-token',
      botName: 'test-bot',
      branches: ['main'],
      pushTags: true,
      createRelease: true,
    });
    mockPublishPackages.mockResolvedValue(['pkg']);
    const { run } = await import('../src/main');
    await run();
    expect(mockCreateReleasesForPackages).toHaveBeenCalledWith({
      releasedPackages: ['pkg'],
      githubToken: 'test-token',
      repo: 'owner/repo',
    });
  });

  it('should not call createReleasesForPackages if releasedPackages is empty', async () => {
    mockHasChangesetFiles.mockReturnValue(true);
    mockGetActionInputs.mockReturnValue({
      githubToken: 'test-token',
      npmToken: 'test-npm-token',
      botName: 'test-bot',
      branches: ['main'],
      pushTags: true,
      createRelease: true,
    });
    mockPublishPackages.mockResolvedValue([]);
    const { run } = await import('../src/main');
    await run();
    expect(mockCreateReleasesForPackages).not.toHaveBeenCalled();
  });

  it('should not call createReleasesForPackages if shouldCreateRelease is false', async () => {
    mockHasChangesetFiles.mockReturnValue(true);
    mockGetActionInputs.mockReturnValue({
      githubToken: 'test-token',
      npmToken: 'test-npm-token',
      botName: 'test-bot',
      branches: ['main'],
      pushTags: true,
      createRelease: false,
    });
    mockPublishPackages.mockResolvedValue(['pkg']);
    const { run } = await import('../src/main');
    await run();
    expect(mockCreateReleasesForPackages).not.toHaveBeenCalled();
  });

  it('should not call pushChangesetTags if repo is missing', async () => {
    mockHasChangesetFiles.mockReturnValue(true);
    mockGetActionInputs.mockReturnValue({
      githubToken: 'test-token',
      npmToken: 'test-npm-token',
      botName: 'test-bot',
      branches: ['main'],
      pushTags: true,
      createRelease: true,
    });
    mockPublishPackages.mockResolvedValue(['pkg']);
    delete process.env.GITHUB_REPOSITORY;
    const { run } = await import('../src/main');
    await run();
    expect(mockPushChangesetTags).not.toHaveBeenCalled();
  });

  it('should not call pushChangesetTags if githubToken is missing', async () => {
    mockHasChangesetFiles.mockReturnValue(true);
    mockGetActionInputs.mockReturnValue({
      githubToken: '',
      npmToken: 'test-npm-token',
      botName: 'test-bot',
      branches: ['main'],
      pushTags: true,
      createRelease: true,
    });
    mockPublishPackages.mockResolvedValue(['pkg']);
    const { run } = await import('../src/main');
    await run();
    expect(mockPushChangesetTags).not.toHaveBeenCalled();
  });

  it('should not call pushChangesetTags if pushTags is false', async () => {
    mockHasChangesetFiles.mockReturnValue(true);
    mockGetActionInputs.mockReturnValue({
      githubToken: 'test-token',
      npmToken: 'test-npm-token',
      botName: 'test-bot',
      branches: ['main'],
      pushTags: false,
      createRelease: true,
    });
    mockPublishPackages.mockResolvedValue(['pkg']);
    const { run } = await import('../src/main');
    await run();
    expect(mockPushChangesetTags).not.toHaveBeenCalled();
  });

  it('should call createChangesetsForRecentCommits if autoChangeset is true', async () => {
    mockHasChangesetFiles.mockReturnValue(true);
    mockGetActionInputs.mockReturnValue({
      githubToken: 'test-token',
      npmToken: 'test-npm-token',
      botName: 'test-bot',
      branches: ['main'],
      autoChangeset: true,
    });
    const { run } = await import('../src/main');
    await run();
    expect(mockCreateChangesetsForRecentCommits).toHaveBeenCalled();
  });

  describe('published output', () => {
    it('should set published output to "true" when packages are published', async () => {
      const coreModule = await import('@actions/core');
      const mockSetOutput = vi.spyOn(coreModule, 'setOutput');

      mockHasChangesetFiles.mockReturnValue(true);
      mockGetActionInputs.mockReturnValue({
        githubToken: 'test-token',
        npmToken: 'test-npm-token',
        botName: 'test-bot',
        branches: ['main'],
        pushTags: true,
        createRelease: true,
      });
      mockPublishPackages.mockResolvedValue([
        {
          dir: '/path/to/package',
          packageJson: { name: 'test-package', version: '1.0.0', private: false },
        },
      ]);

      const { run } = await import('../src/main');
      await run();

      expect(mockSetOutput).toHaveBeenCalledWith('published', 'true');
    });

    it('should set published output to "false" when no packages are published', async () => {
      const coreModule = await import('@actions/core');
      const mockSetOutput = vi.spyOn(coreModule, 'setOutput');

      mockHasChangesetFiles.mockReturnValue(true);
      mockGetActionInputs.mockReturnValue({
        githubToken: 'test-token',
        npmToken: 'test-npm-token',
        botName: 'test-bot',
        branches: ['main'],
      });
      mockPublishPackages.mockResolvedValue([]);

      const { run } = await import('../src/main');
      await run();

      expect(mockSetOutput).toHaveBeenCalledWith('published', 'false');
    });

    it('should set published output to "false" when npm token is missing and nothing is published', async () => {
      const coreModule = await import('@actions/core');
      const mockSetOutput = vi.spyOn(coreModule, 'setOutput');

      mockHasChangesetFiles.mockReturnValue(true);
      mockGetActionInputs.mockReturnValue({
        githubToken: 'test-token',
        npmToken: undefined,
        botName: 'test-bot',
        branches: ['main'],
      });
      mockPublishPackages.mockResolvedValue([]);

      const { run } = await import('../src/main');
      await run();

      expect(mockPublishPackages).toHaveBeenCalled();
      expect(mockSetOutput).toHaveBeenCalledWith('published', 'false');
    });

    it('should set published output to "false" when no changesets to process', async () => {
      const coreModule = await import('@actions/core');
      const mockSetOutput = vi.spyOn(coreModule, 'setOutput');

      mockHasChangesetFiles.mockReturnValue(false);
      mockGetActionInputs.mockReturnValue({
        githubToken: 'test-token',
        npmToken: 'test-npm-token',
        botName: 'test-bot',
        branches: ['main'],
      });

      const { run } = await import('../src/main');
      await run();

      expect(mockSetOutput).toHaveBeenCalledWith('published', 'false');
    });

    it('should set published output to "false" on error', async () => {
      const coreModule = await import('@actions/core');
      const mockSetOutput = vi.spyOn(coreModule, 'setOutput');

      mockGetActionInputs.mockImplementation(() => {
        throw new Error('Test error');
      });

      const { run } = await import('../src/main');
      await run();

      expect(mockSetOutput).toHaveBeenCalledWith('published', 'false');
    });
  });
});
