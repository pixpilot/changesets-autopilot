import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ensureChangesetsAvailable,
  ensurePackagesAvailable,
} from '../../src/changeset/ensure-changesets-available';

// Mock fs module
vi.mock('fs', async () => {
  const actual = await vi.importActual('fs');
  return {
    ...actual,
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  };
});

// Mock @actions/core
vi.mock('@actions/core');

const fs = await import('node:fs');
const core = await import('@actions/core');

const existsSync = fs.existsSync as unknown as ReturnType<typeof vi.fn>;
const readFileSync = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
const warning = core.warning as unknown as ReturnType<typeof vi.fn>;

describe('ensure-changesets-available', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ensurePackagesAvailable', () => {
    it('should pass when required packages are in dependencies', () => {
      const packageJson = {
        name: 'test-package',
        dependencies: {
          '@changesets/cli': '^2.0.0',
          'other-package': '^1.0.0',
        },
      };

      existsSync.mockReturnValue(true);
      readFileSync.mockReturnValue(JSON.stringify(packageJson));

      expect(() => {
        ensurePackagesAvailable(['@changesets/cli']);
      }).not.toThrow();

      expect(existsSync).toHaveBeenCalledWith(path.join(process.cwd(), 'package.json'));
      expect(readFileSync).toHaveBeenCalledWith(
        path.join(process.cwd(), 'package.json'),
        'utf8',
      );
    });

    it('should pass when required packages are in devDependencies', () => {
      const packageJson = {
        name: 'test-package',
        devDependencies: {
          '@changesets/cli': '^2.0.0',
          vitest: '^1.0.0',
        },
      };

      existsSync.mockReturnValue(true);
      readFileSync.mockReturnValue(JSON.stringify(packageJson));

      expect(() => {
        ensurePackagesAvailable(['@changesets/cli']);
      }).not.toThrow();
    });

    it('should pass when packages are in both dependencies and devDependencies', () => {
      const packageJson = {
        name: 'test-package',
        dependencies: {
          '@changesets/cli': '^2.0.0',
        },
        devDependencies: {
          vitest: '^1.0.0',
        },
      };

      existsSync.mockReturnValue(true);
      readFileSync.mockReturnValue(JSON.stringify(packageJson));

      expect(() => {
        ensurePackagesAvailable(['@changesets/cli', 'vitest']);
      }).not.toThrow();
    });

    it('should throw error when required package is missing', () => {
      const packageJson = {
        name: 'test-package',
        dependencies: {
          'other-package': '^1.0.0',
        },
      };

      existsSync.mockReturnValue(true);
      readFileSync.mockReturnValue(JSON.stringify(packageJson));

      expect(() => {
        ensurePackagesAvailable(['@changesets/cli']);
      }).toThrow(
        'Package @changesets/cli is not declared in package.json. Please add it to your dependencies or devDependencies.',
      );
    });

    it('should throw error when one of multiple packages is missing', () => {
      const packageJson = {
        name: 'test-package',
        dependencies: {
          '@changesets/cli': '^2.0.0',
        },
      };

      existsSync.mockReturnValue(true);
      readFileSync.mockReturnValue(JSON.stringify(packageJson));

      expect(() => {
        ensurePackagesAvailable(['@changesets/cli', 'missing-package']);
      }).toThrow(
        'Package missing-package is not declared in package.json. Please add it to your dependencies or devDependencies.',
      );
    });

    it('should handle empty packages array', () => {
      const packageJson = {
        name: 'test-package',
      };

      existsSync.mockReturnValue(true);
      readFileSync.mockReturnValue(JSON.stringify(packageJson));

      expect(() => {
        ensurePackagesAvailable([]);
      }).not.toThrow();
    });

    it('should throw error and log warning when package.json does not exist', () => {
      existsSync.mockReturnValue(false);

      expect(() => {
        ensurePackagesAvailable(['@changesets/cli']);
      }).toThrow(
        'Package @changesets/cli is not declared in package.json. Please add it to your dependencies or devDependencies.',
      );

      expect(warning).toHaveBeenCalledWith(
        'Failed to read package.json: package.json not found',
      );
    });

    it('should handle malformed package.json and log warning', () => {
      existsSync.mockReturnValue(true);
      readFileSync.mockReturnValue('invalid json');

      expect(() => {
        ensurePackagesAvailable(['@changesets/cli']);
      }).toThrow(
        'Package @changesets/cli is not declared in package.json. Please add it to your dependencies or devDependencies.',
      );

      expect(warning).toHaveBeenCalledWith(
        expect.stringContaining('Failed to read package.json:'),
      );
    });

    it('should handle package.json without dependencies sections', () => {
      const packageJson = {
        name: 'test-package',
        version: '1.0.0',
      };

      existsSync.mockReturnValue(true);
      readFileSync.mockReturnValue(JSON.stringify(packageJson));

      expect(() => {
        ensurePackagesAvailable(['@changesets/cli']);
      }).toThrow(
        'Package @changesets/cli is not declared in package.json. Please add it to your dependencies or devDependencies.',
      );
    });

    it('should handle package.json with empty dependencies sections', () => {
      const packageJson = {
        name: 'test-package',
        dependencies: {},
        devDependencies: {},
      };

      existsSync.mockReturnValue(true);
      readFileSync.mockReturnValue(JSON.stringify(packageJson));

      expect(() => {
        ensurePackagesAvailable(['@changesets/cli']);
      }).toThrow(
        'Package @changesets/cli is not declared in package.json. Please add it to your dependencies or devDependencies.',
      );
    });

    it('should handle package.json with null dependencies', () => {
      const packageJson = {
        name: 'test-package',
        dependencies: null,
        devDependencies: null,
      };

      existsSync.mockReturnValue(true);
      readFileSync.mockReturnValue(JSON.stringify(packageJson));

      expect(() => {
        ensurePackagesAvailable(['@changesets/cli']);
      }).toThrow(
        'Package @changesets/cli is not declared in package.json. Please add it to your dependencies or devDependencies.',
      );
    });

    it('should ignore peerDependencies', () => {
      const packageJson = {
        name: 'test-package',
        peerDependencies: {
          '@changesets/cli': '^2.0.0',
        },
      };

      existsSync.mockReturnValue(true);
      readFileSync.mockReturnValue(JSON.stringify(packageJson));

      // Should throw because peerDependencies are not checked
      expect(() => {
        ensurePackagesAvailable(['@changesets/cli']);
      }).toThrow(
        'Package @changesets/cli is not declared in package.json. Please add it to your dependencies or devDependencies.',
      );
    });

    it('should handle file read errors and log warning', () => {
      existsSync.mockReturnValue(true);
      readFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      expect(() => {
        ensurePackagesAvailable(['@changesets/cli']);
      }).toThrow(
        'Package @changesets/cli is not declared in package.json. Please add it to your dependencies or devDependencies.',
      );

      expect(warning).toHaveBeenCalledWith(
        'Failed to read package.json: Permission denied',
      );
    });

    it('should handle multiple package checks with mixed results', () => {
      const packageJson = {
        name: 'test-package',
        dependencies: {
          package1: '^1.0.0',
        },
        devDependencies: {
          package2: '^2.0.0',
        },
      };

      existsSync.mockReturnValue(true);
      readFileSync.mockReturnValue(JSON.stringify(packageJson));

      expect(() => {
        ensurePackagesAvailable(['package1', 'package2']);
      }).not.toThrow();

      expect(() => {
        ensurePackagesAvailable(['package1', 'package2', 'missing-package']);
      }).toThrow(
        'Package missing-package is not declared in package.json. Please add it to your dependencies or devDependencies.',
      );
    });
  });

  describe('ensureChangesetsAvailable', () => {
    it('should pass when @changesets/cli is in devDependencies', () => {
      const packageJson = {
        name: 'test-package',
        devDependencies: {
          '@changesets/cli': '^2.0.0',
        },
      };

      existsSync.mockReturnValue(true);
      readFileSync.mockReturnValue(JSON.stringify(packageJson));

      expect(() => {
        ensureChangesetsAvailable();
      }).not.toThrow();
    });

    it('should pass when @changesets/cli is in dependencies', () => {
      const packageJson = {
        name: 'test-package',
        dependencies: {
          '@changesets/cli': '^2.0.0',
        },
      };

      existsSync.mockReturnValue(true);
      readFileSync.mockReturnValue(JSON.stringify(packageJson));

      expect(() => {
        ensureChangesetsAvailable();
      }).not.toThrow();
    });

    it('should throw error when @changesets/cli is not available', () => {
      const packageJson = {
        name: 'test-package',
        dependencies: {
          'other-package': '^1.0.0',
        },
      };

      existsSync.mockReturnValue(true);
      readFileSync.mockReturnValue(JSON.stringify(packageJson));

      expect(() => {
        ensureChangesetsAvailable();
      }).toThrow(
        'Package @changesets/cli is not declared in package.json. Please add it to your dependencies or devDependencies.',
      );
    });

    it('should handle package.json read errors and log warning', () => {
      existsSync.mockReturnValue(false);

      expect(() => {
        ensureChangesetsAvailable();
      }).toThrow(
        'Package @changesets/cli is not declared in package.json. Please add it to your dependencies or devDependencies.',
      );

      expect(warning).toHaveBeenCalledWith(
        'Failed to read package.json: package.json not found',
      );
    });

    it('should handle malformed package.json', () => {
      existsSync.mockReturnValue(true);
      readFileSync.mockReturnValue('{ invalid json');

      expect(() => {
        ensureChangesetsAvailable();
      }).toThrow(
        'Package @changesets/cli is not declared in package.json. Please add it to your dependencies or devDependencies.',
      );

      expect(warning).toHaveBeenCalledWith(
        expect.stringContaining('Failed to read package.json:'),
      );
    });

    it('should work with empty package.json but fail appropriately', () => {
      const packageJson = {};

      existsSync.mockReturnValue(true);
      readFileSync.mockReturnValue(JSON.stringify(packageJson));

      expect(() => {
        ensureChangesetsAvailable();
      }).toThrow(
        'Package @changesets/cli is not declared in package.json. Please add it to your dependencies or devDependencies.',
      );
    });
  });
});
