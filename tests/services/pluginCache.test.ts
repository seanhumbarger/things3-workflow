import { CacheService, PluginCacheEntry } from '../../src/services/cacheService';

jest.mock('fs');

describe('CacheService', () => {
  const mockPlugin: any = {
    manifest: { id: 'test-plugin' },
    app: {
      vault: {
        configDir: 'test-config',
        adapter: {
          exists: jest.fn(),
          read: jest.fn(),
          write: jest.fn(),
        },
      },
    },
  };

  beforeEach(() => {
    mockPlugin.app.vault.adapter.exists.mockReset();
    mockPlugin.app.vault.adapter.read.mockReset();
    mockPlugin.app.vault.adapter.write.mockReset();
  });

  it('initializes and adds/gets/clears cache entries', async () => {
    const cache = new CacheService(mockPlugin);
    await cache.load();
    expect(cache.has('foo')).toBe(false);
    cache.add('foo', { importedAt: '2025-12-12', filePath: 'foo.md' });
    expect(cache.has('foo')).toBe(true);
    expect(cache.getAll()).toHaveProperty('foo');
    await cache.save();
    await cache.clear();
    expect(cache.has('foo')).toBe(false);
  });

  it('loads cache from disk if file exists', async () => {
    mockPlugin.app.vault.adapter.exists.mockResolvedValue(true);
    mockPlugin.app.vault.adapter.read.mockResolvedValue('{"bar":{"importedAt":"2025-12-12","filePath":"bar.md"}}');
    const cache = new CacheService(mockPlugin);
    await cache.load();
    expect(cache.has('bar')).toBe(true);
  });

  it('starts with empty cache if file does not exist', async () => {
    mockPlugin.app.vault.adapter.exists.mockResolvedValue(false);
    const cache = new CacheService(mockPlugin);
    await cache.load();
    expect(Object.keys(cache.getAll()).length).toBe(0);
  });
});
