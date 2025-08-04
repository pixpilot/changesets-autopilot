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
  console.warn('[getChangeTypeAndDescription] Received message:', message);
  try {
    console.warn('[getChangeTypeAndDescription] Parsing message...');
    const parsed = (await parse(message, undefined, parserOptions)) as ParsedCommit;
    console.warn('[getChangeTypeAndDescription] Parsed result:', parsed);
    const notes: CommitNote[] = Array.isArray(parsed.notes) ? parsed.notes : [];
    console.warn('[getChangeTypeAndDescription] Commit notes:', notes);
    const isBreaking = notes.some((note: CommitNote) => note.title === 'BREAKING CHANGE');
    console.warn('[getChangeTypeAndDescription] isBreaking:', isBreaking);
    if (isBreaking) {
      const breakingNote = notes.find(
        (note: CommitNote) => note.title === 'BREAKING CHANGE',
      );
      console.warn('[getChangeTypeAndDescription] Breaking note:', breakingNote);
      return {
        changeType: 'major',
        scope: parsed.scope ?? null,
        description: breakingNote?.text ?? parsed.subject ?? '',
      };
    }
    switch (parsed.type) {
      case 'feat':
        console.warn('[getChangeTypeAndDescription] Type is feat');
        return {
          changeType: 'minor',
          scope: parsed.scope ?? null,
          description: parsed.subject ?? '',
        };
      case 'fix':
      case 'perf':
      case 'revert':
        console.warn('[getChangeTypeAndDescription] Type is patch:', parsed.type);
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
        console.warn('[getChangeTypeAndDescription] Type is none:', parsed.type);
        return {
          changeType: 'none',
          scope: parsed.scope ?? null,
          description: parsed.subject ?? '',
        };
      default:
        console.warn('[getChangeTypeAndDescription] Type is unknown:', parsed.type);
        return {
          changeType: 'none',
          scope: null,
          description: message,
        };
    }
  } catch (_error) {
    console.warn('[getChangeTypeAndDescription] Error occurred:', _error);
    return {
      changeType: 'none',
      scope: null,
      description: message,
    };
  }
}
