declare module 'sql.js' {
  export interface SqlJsStatic {
    Database: {
      new (data?: Uint8Array): Database;
    };
    [key: string]: unknown;
  }
  export interface Database {
    exec(sql: string): Array<{ columns: string[]; values: unknown[][] }>;
    prepare(sql: string): Statement;
    close(): void;
    [key: string]: unknown;
  }
  export interface Statement {
    bind(values?: unknown[]): boolean;
    step(): boolean;
    getAsObject(): Record<string, unknown>;
    free(): void;
    [key: string]: unknown;
  }
  const initSqlJs: (config?: Record<string, unknown>) => Promise<SqlJsStatic>;
  export default initSqlJs;
}
