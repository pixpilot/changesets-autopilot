export interface BranchConfig {
  name: string;
  prerelease?: string;
  channel?: string;
}

export interface ActionInputs {
  githubToken: string;
  npmToken: string;
  botName: string;
  branches: (string | BranchConfig)[];
}
