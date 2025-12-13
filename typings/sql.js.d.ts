declare module 'sql.js' {
  export interface SqlJsStatic {
    Database: any;
    [key: string]: any;
  }
  export interface Database {
    exec(sql: string): any;
    prepare(sql: string): any;
    close(): void;
    [key: string]: any;
  }
  const initSqlJs: (config?: any) => Promise<SqlJsStatic>;
  export default initSqlJs;
}

