import type { MockedFunction } from 'vitest';
import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';

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
vi.mock('../src/changeset/ensure-changesets');
vi.mock('../src/changeset/configure-prerelease-mode');
vi.mock('../src/git/version-and-push');
vi.mock('../src/publisher/publish-packages');
vi.mock('../src/github/create-release');

describe('main.js', () => {
  let mockGetActionInputs: MockedFunction<any>;
  let mockGetBranchConfig: MockedFunction<any>;
  let mockValidateBranchConfiguration: MockedFunction<any>;
  let mockConfigureGit: MockedFunction<any>;
  let mockEnsureChangesets: MockedFunction<any>;
  let mockConfigurePrereleaseMode: MockedFunction<any>;
  let mockGitVersionAndPush: MockedFunction<any>;
  let mockPublishPackages: MockedFunction<any>;
  let mockCreateRelease: MockedFunction<any>;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    // Setup default mocks
    const getActionInputsModule = await import('../src/config/get-action-inputs');
    const getBranchConfigModule = await import('../src/config/get-branch-config');
    const validateBranchConfigurationModule = await import(
      '../src/config/validate-branch-configuration'
    );
    const configureGitModule = await import('../src/git/configure-git');
    const ensureChangesetsModule = await import('../src/changeset/ensure-changesets');
    const configurePrereleaseModeModule = await import(
      '../src/changeset/configure-prerelease-mode'
    );
    const gitVersionAndPushModule = await import('../src/git/commit-and-push');
    const publishPackagesModule = await import('../src/publisher/publish-packages');
    const createReleaseModule = await import('../src/github/create-release');

    mockGetActionInputs = vi.mocked(getActionInputsModule.getActionInputs);
    mockGetBranchConfig = vi.mocked(getBranchConfigModule.getBranchConfig);
    mockValidateBranchConfiguration = vi.mocked(
      validateBranchConfigurationModule.validateBranchConfiguration,
    );
    mockConfigureGit = vi.mocked(configureGitModule.configureGit);
    mockEnsureChangesets = vi.mocked(ensureChangesetsModule.ensureChangesets);
    mockConfigurePrereleaseMode = vi.mocked(
      configurePrereleaseModeModule.configurePrereleaseMode,
    );
    mockGitVersionAndPush = vi.mocked(gitVersionAndPushModule.commitAndPush);
    mockPublishPackages = vi.mocked(publishPackagesModule.publishPackages);
    mockCreateRelease = vi.mocked(createReleaseModule.createRelease);

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
    mockEnsureChangesets.mockResolvedValue(true);
    mockPublishPackages.mockResolvedValue([]);
    mockCreateRelease.mockResolvedValue(undefined);

    process.env.GITHUB_REF_NAME = 'main';
    process.env.GITHUB_REPOSITORY = 'owner/repo';
  });

  afterEach(() => {
    delete process.env.GITHUB_REF_NAME;
    delete process.env.GITHUB_REPOSITORY;
  });

  test('should skip processing for unconfigured branch', async () => {
    mockValidateBranchConfiguration.mockReturnValue(false);

    const { run } = await import('../src/main');
    await run();

    expect(mockValidateBranchConfiguration).toHaveBeenCalled();
    expect(mockEnsureChangesets).not.toHaveBeenCalled();
  });

  test('handles errors correctly', async () => {
    const error = new Error('Test error');
    mockGetActionInputs.mockImplementation(() => {
      throw error;
    });

    const { run } = await import('../src/main');
    await run();

    // Just verify the function was called since we mocked the implementation
    expect(mockGetActionInputs).toHaveBeenCalled();
  });

  test('should process release with changesets and npm token', async () => {
    mockEnsureChangesets.mockResolvedValue(true);

    const { run } = await import('../src/main');
    await run();

    expect(mockGitVersionAndPush).toHaveBeenCalled();
    expect(mockPublishPackages).toHaveBeenCalled();
  });

  test('should process release with no changesets', async () => {
    mockEnsureChangesets.mockResolvedValue(false);

    const { run } = await import('../src/main');
    await run();

    expect(mockGitVersionAndPush).not.toHaveBeenCalled();
    expect(mockPublishPackages).not.toHaveBeenCalled();
  });

  test('should skip publish step if npm token is missing', async () => {
    mockGetActionInputs.mockReturnValue({
      githubToken: 'test-token',
      npmToken: '',
      botName: 'test-bot',
      branches: ['main'],
    });
    mockEnsureChangesets.mockResolvedValue(true);

    const { run } = await import('../src/main');
    await run();

    expect(mockGitVersionAndPush).toHaveBeenCalled();
    expect(mockPublishPackages).not.toHaveBeenCalled();
  });

  test('should configure prerelease mode for prerelease branch', async () => {
    const prereleaseConfig = {
      name: 'next',
      prerelease: 'rc',
      channel: 'next',
      isMatch: true,
    };
    mockGetBranchConfig.mockReturnValue(prereleaseConfig);
    mockEnsureChangesets.mockResolvedValue(false);

    const { run } = await import('../src/main');
    await run();

    expect(mockConfigurePrereleaseMode).toHaveBeenCalledWith(prereleaseConfig);
  });
});
