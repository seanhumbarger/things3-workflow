import { SqliteProvider } from '../../src/providers/sqliteProvider';

jest.mock('fs');

// Mock Buffer for fs.readFileSync
const mockBuffer = Buffer.from('SQLite format 3\0');

// Patch fs.readFileSync to always return a valid buffer
const fs = require('fs');
fs.readFileSync.mockReturnValue(mockBuffer);

describe('SqliteProvider', () => {
  it('getWasmUrl returns a resource path', () => {
    const plugin: any = {
      manifest: { id: 'test-plugin' },
      app: {
        vault: {
          configDir: 'test-config',
          adapter: { getResourcePath: jest.fn((p: string) => `resource://${p || 'test-config/plugins/test-plugin/sql-wasm.wasm'}`) },
        },
      },
    };
    const provider = new SqliteProvider();
    const url = provider.getWasmUrl(plugin);
    expect(url).toContain('resource://');
    expect(url).toContain('sql-wasm.wasm');
  });

  it('throws on openDatabase error', async () => {
    fs.readFileSync.mockImplementationOnce(() => { throw new Error('fail'); });
    const provider = new SqliteProvider();
    await expect(provider.openDatabase('/bad/path', '/bad/wasm')).rejects.toThrow();
  });
});
