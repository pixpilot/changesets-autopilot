export * from './changes';
export * from './inputs';

export interface ChangeTypeResult {
  changeType: 'major' | 'minor' | 'patch' | 'none';
  scope: string | null;
  description: string;
}
