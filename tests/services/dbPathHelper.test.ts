import { DbPathService } from '../../src/services/dbPathService';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

jest.mock('fs');
jest.mock('os');
jest.mock('path');

describe('DbPathService', () => {
  beforeEach(() => {
    (fs.existsSync as jest.Mock).mockReset();
    (fs.statSync as jest.Mock).mockReset();
    (fs.openSync as jest.Mock).mockReset();
    (fs.readSync as jest.Mock).mockReset();
    (fs.closeSync as jest.Mock).mockReset();
    (fs.accessSync as jest.Mock).mockReset();
    (path.extname as jest.Mock).mockReset();
    (os.homedir as jest.Mock).mockReturnValue('/home/test');
    (path.resolve as jest.Mock).mockImplementation((...args) => {
      // If the path contains ~, expand it to /home/test
      const p = args.join('/');
      if (p.includes('~')) return p.replace('~', '/home/test');
      return p;
    });
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
  });

  it('resolves ~ in configuredPath to home directory', () => {
    const testPath = '/home/test/fake/path/main.sqlite';
    const literalPath = '~/fake/path/main.sqlite';
    (fs.existsSync as jest.Mock).mockImplementation((p) => {
      console.log('existsSync called with:', p);
      return (
        p === testPath ||
        p === literalPath ||
        p === '/home/test//fake/path/main.sqlite' // allow double slash variant
      );
    });
    (fs.statSync as jest.Mock).mockImplementation((p) => {
      console.log('statSync called with:', p);
      return { isDirectory: () => false } as any;
    });
    (fs.openSync as jest.Mock).mockReturnValue(1 as any);
    (fs.readSync as jest.Mock).mockImplementation((fd, buf, offset, len, pos) => {
      Buffer.from('SQLite format 3\0').copy(buf, offset, 0, 16);
      return 16;
    });
    (fs.closeSync as jest.Mock).mockImplementation(() => {});
    (fs.accessSync as jest.Mock).mockImplementation(() => {});
    (path.extname as jest.Mock).mockImplementation((p) => {
      console.log('extname called with:', p);
      return (p === testPath || p === '/home/test//fake/path/main.sqlite') ? '.sqlite' : '';
    });
    const helper = new DbPathService('~/fake/path/main.sqlite');
    expect([testPath, '/home/test//fake/path/main.sqlite']).toContain(helper.dbPath);
  });

  it('throws if no valid dbPath is found', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    expect(() => new DbPathService('/invalid/path')).toThrow();
  });
});
