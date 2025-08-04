import { CommitParser } from 'conventional-commits-parser';

export type ChangeType = 'major' | 'minor' | 'patch' | 'none';

export interface ChangeTypeResult {
  changeType: ChangeType;
  scope: string | null;
  description: string;
}

interface CommitNote {
  title: string;
  text: string;
}

interface ParsedCommit {
  type?: string | null;
  scope?: string | null;
  subject?: string | null;
  notes?: CommitNote[];
  breaking?: string | null;
}

const parserOptions = {
  headerPattern: /^(\w+)(?:\(([^)]+)\))?(!)?\s*:\s+(.+)$/,
  headerCorrespondence: ['type', 'scope', 'breaking', 'subject'],
};

export function getChangeTypeAndDescription(message: string): ChangeTypeResult {
  try {
    const parser = new CommitParser(parserOptions);
    const parsed = parser.parse(message) as ParsedCommit;
    const notes: CommitNote[] = Array.isArray(parsed.notes) ? parsed.notes : [];
    const isBreaking =
      notes.some((note: CommitNote) => note.title === 'BREAKING CHANGE') ||
      parsed.breaking === '!';

    if (isBreaking) {
      const breakingNote = notes.find(
        (note: CommitNote) => note.title === 'BREAKING CHANGE',
      );
      return {
        changeType: 'major',
        scope: parsed.breaking === '!' ? null : (parsed.scope ?? null),
        description: breakingNote?.text ?? parsed.subject ?? '',
      };
    }
    switch (parsed.type) {
      case 'feat':
        return {
          changeType: 'minor',
          scope: parsed.scope ?? null,
          description: parsed.subject ?? '',
        };
      case 'fix':
      case 'perf':
      case 'revert':
        return {
          changeType: 'patch',
          scope: parsed.scope ?? null,
          description: parsed.subject ?? '',
        };
      case 'build':
      case 'chore':
      case 'ci':
      case 'docs':
      case 'refactor':
      case 'style':
      case 'test':
        return {
          changeType: 'none',
          scope: parsed.scope ?? null,
          description: parsed.subject ?? '',
        };
      default:
        return {
          changeType: 'none',
          scope: null,
          description: message,
        };
    }
  } catch (_error) {
    return {
      changeType: 'none',
      scope: null,
      description: message,
    };
  }
}
