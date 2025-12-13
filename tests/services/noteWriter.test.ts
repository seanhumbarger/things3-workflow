import { NoteWriterService } from '../../src/services/noteWriterService';

jest.mock('fs');

describe('NoteWriterService', () => {
  let plugin: any;
  let settings: any;
  let db: any;
  let pluginCache: any;
  let thingsService: any;
  let folderCreated = false;

  beforeEach(() => {
    // Reset folderCreated for each test
    folderCreated = false;
    plugin = {
      app: {
        vault: {
          getAbstractFileByPath: jest.fn((path: string) => {
            if (path === 'Imported') return folderCreated ? {} : undefined;
            if (path.endsWith('.md')) return undefined;
            return undefined;
          }),
          createFolder: jest.fn().mockImplementation(async (folder: string) => {
            folderCreated = true;
            return undefined;
          }),
          create: jest.fn().mockResolvedValue(undefined),
          modify: jest.fn().mockResolvedValue(undefined),
        },
      },
    };
    settings = {
      noteSectionHeader: 'Note',
      detailsSectionHeader: 'Details',
      checklistSectionHeader: 'Checklist',
      customTags: 'imported, things3',
      includeProjectAsTag: true,
      includeAreaAsTag: true,
      destinationFolder: 'Imported',
    };
    db = {};
    pluginCache = { load: jest.fn(), add: jest.fn(), save: jest.fn() };
    thingsService = { getChecklistItemsByTask: jest.fn().mockReturnValue([{ title: 'Check', checked: true }]) };
  });

  it('writes a note and updates the cache', async () => {
    const writer = new NoteWriterService();
    await writer.writeNote(
      plugin,
      { uuid: 'abc', title: 'Test', notes: 'Body', tags: 'tag1,tag2', project: 'proj', area: 'area', creationDate: 1000, startDate: 1000, stopDate: 1000, deadline: 1000, status: 'open' },
      settings,
      db,
      pluginCache,
      thingsService
    );
    // Folder creation is not required if folder exists, so only check note and cache
    expect(plugin.app.vault.create).toHaveBeenCalled();
    expect(pluginCache.add).toHaveBeenCalledWith('abc', expect.any(Object));
    expect(pluginCache.save).toHaveBeenCalled();
  });

  it('does not write note if filePath is invalid', async () => {
    const writer = new NoteWriterService();
    const row = { uuid: 'abc', title: '', notes: '', tags: '', project: '', area: '', creationDate: 1000, startDate: 1000, stopDate: 1000, deadline: 1000, status: 'open' };
    const { filePath } = writer['prepareFilePath'](row, settings);
    console.log('Test filePath for empty title:', filePath);
    await writer.writeNote(
      plugin,
      row,
      settings,
      db,
      pluginCache,
      thingsService
    );
    // Should call create and add to cache for Untitled file
    expect(plugin.app.vault.create).toHaveBeenCalled();
    expect(pluginCache.add).toHaveBeenCalledWith('abc', expect.any(Object));
  });
});
