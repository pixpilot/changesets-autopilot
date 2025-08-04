export interface Commit {
  hash: string;
  date: string;
  message: string;
  refs: string;
  body: string;
  author_name: string;
  author_email: string;
}

export interface PackageChange {
  files: string[];
  commits: Commit[];
  version: string;
  private: boolean;
}

export type ChangesMap = Record<string, PackageChange>;
