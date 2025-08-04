import parse from '@commitlint/parse';

export type ChangeType = 'major' | 'minor' | 'patch' | 'none';

export interface ChangeTypeResult {
  changeType: ChangeType;
  scope: string | null;
  description: string;
}

interface CommitNote {
  title?: string;
  text?: string;
}

interface ParsedCommit {
  type?: string;
  scope?: string | null;
  subject?: string;
  notes?: CommitNote[];
}

const parserOptions = {
  // Require space after colon: \s+ instead of \s*
  headerPattern: /^(\w+)(?:\(([^)]*)\))?\s*:\s+(.+)$/,
  // Breaking change pattern also requires space after colon
  breakingHeaderPattern: /^(\w+)(?:\(([^)]*)\))?!\s*:\s+(.+)$/,
};

export async function getChangeTypeAndDescription(
  message: string,
): Promise<ChangeTypeResult> {
  try {
    const parsed = (await parse(message, undefined, parserOptions)) as ParsedCommit;
    const notes: CommitNote[] = Array.isArray(parsed.notes) ? parsed.notes : [];
    const isBreaking = notes.some((note: CommitNote) => note.title === 'BREAKING CHANGE');
    if (isBreaking) {
      const breakingNote = notes.find(
        (note: CommitNote) => note.title === 'BREAKING CHANGE',
      );
      return {
        changeType: 'major',
        scope: parsed.scope ?? null,
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
