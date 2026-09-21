export interface BranchConfig {
  name: string;
  prerelease?: string;
  channel?: string;
}

export interface ActionInputs {
  githubToken: string;
  registryToken?: string;
  botName: string;
  branches: (string | BranchConfig)[];
  createRelease: boolean;
  pushTags: boolean;
  autoChangeset: boolean;
}
