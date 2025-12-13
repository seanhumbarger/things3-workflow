export default async function initSqlJs() {
  return {
    Database: class {
      constructor() {}
      exec() { return []; }
      prepare() { return { bind: () => {}, step: () => false, getAsObject: () => ({}), free: () => {} }; }
      close() {}
    },
  };
}
export class Database {
  exec() { return []; }
  prepare() { return { bind: () => {}, step: () => false, getAsObject: () => ({}), free: () => {} }; }
  close() {}
}

