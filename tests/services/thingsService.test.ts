import { Things3Service } from '../../src/services/things3Service';

jest.mock('fs');

describe('Things3Service', () => {
  let db: any;
  let pluginCache: any;
  let settings: any;

  beforeEach(() => {
    db = {
      prepare: jest.fn().mockReturnValue({
        bind: jest.fn(),
        step: jest.fn()
          .mockReturnValueOnce(true)
          .mockReturnValueOnce(false),
        getAsObject: jest.fn().mockReturnValue({ uuid: 'abc', title: 'Test', tags: 'tag1,tag2', project: 'proj', area: 'area', status: 'open', notes: 'body', checklist: '', creationDate: 1000, startDate: 1000, stopDate: 1000, deadline: 1000 }),
        free: jest.fn(),
      }),
    };
    pluginCache = { has: jest.fn().mockReturnValue(false) };
    settings = { filterTags: '', filterProjects: '', filterAreas: '' };
  });

  it('returns filtered tasks', () => {
    const service = new Things3Service();
    const tasks = service.getTasks(db, settings, pluginCache);
    expect(tasks.length).toBe(1);
    expect(tasks[0].uuid).toBe('abc');
  });

  it('filters out tasks in the cache', () => {
    pluginCache.has.mockReturnValue(true);
    const service = new Things3Service();
    const tasks = service.getTasks(db, settings, pluginCache);
    expect(tasks.length).toBe(0);
  });

  it('gets checklist items by task', () => {
    db.prepare = jest.fn().mockReturnValue({
      bind: jest.fn(),
      step: jest.fn()
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false),
      getAsObject: jest.fn().mockReturnValue({ title: 'Check', status: 3 }),
      free: jest.fn(),
    });
    const service = new Things3Service();
    const checklist = service.getChecklistItemsByTask(db, 'abc');
    expect(checklist.length).toBe(1);
    expect(checklist[0].title).toBe('Check');
    expect(checklist[0].checked).toBe(true);
  });

  it('handles undefined filter settings gracefully', () => {
    const service = new Things3Service();
    // @ts-expect-error purposely pass undefined
    const filters = service["prepareFilters"]({});
    expect(filters.tags).toEqual([]);
    expect(filters.projects).toEqual([]);
    expect(filters.areas).toEqual([]);
  });

  it('handles non-string filter settings gracefully', () => {
    const service = new Things3Service();
    // @ts-expect-error purposely pass numbers
    const filters = service["prepareFilters"]({ filterTags: 123, filterProjects: 456, filterAreas: 789 });
    expect(filters.tags).toEqual([]);
    expect(filters.projects).toEqual([]);
    expect(filters.areas).toEqual([]);
  });
});
