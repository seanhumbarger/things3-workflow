import { Database } from 'sql.js';
import { Things3WorkflowSettings } from '../settings';
import { CacheService } from './cacheService';

/**
 * Things3Service
 *
 * Provides methods to query and filter Things3 tasks from the SQLite database according to plugin settings and cache state.
 *
 * Responsibilities:
 * - Build and execute SQL queries to fetch tasks, applying tag, project, and area filters.
 * - Exclude tasks that have already been imported (using CacheService).
 * - Prepare query parameters and WHERE clauses based on user settings.
 * - Retrieve checklist items for a given task, ordered by their index.
 *
 * Usage:
 *   const service = new Things3Service();
 *   const tasks = service.getTasks(db, settings, pluginCache);
 *   const checklist = service.getChecklistItemsByTask(db, taskUuid);
 *
 * @class Things3Service
 */
export class Things3Service {
  /**
   * Query Things3 tasks with filters from settings, excluding those in the cache.
   *
   * @param db sql.js Database instance
   * @param settings Plugin settings
   * @param pluginCache CacheService instance
   * @returns Array of task rows (each row is an object with task fields)
   */
  getTasks(db: Database, settings: Things3WorkflowSettings, pluginCache: CacheService): any[] {
    const { tags, projects, areas } = this.prepareFilters(settings);
    const whereClauses = this.buildWhereClauses(tags, projects, areas);
    const sql = this.buildQuery(whereClauses);
    const params = this.buildParams(tags, projects, areas);
    const allRows = this.executeQuery(db, sql, params);
    // Filter out any rows whose UUID is in the plugin cache
    return allRows.filter(row => !pluginCache.has(row.uuid));
  }

  /**
   * Parse and prepare tag, project, and area filters from plugin settings.
   *
   * @param settings Plugin settings
   * @returns Object with arrays: tags, projects, areas
   */
  private prepareFilters(settings: Things3WorkflowSettings) {
    const tags = settings.filterTags.split(',').map(t => t.trim()).filter(Boolean);
    const projects = settings.filterProjects.split(',').map(p => p.trim()).filter(Boolean);
    const areas = settings.filterAreas.split(',').map(a => a.trim()).filter(Boolean);
    return { tags, projects, areas };
  }

  /**
   * Build SQL WHERE clauses for tag, project, and area filters.
   *
   * @param tags Array of tag names
   * @param projects Array of project names
   * @param areas Array of area names
   * @returns Array of SQL WHERE clause strings
   */
  private buildWhereClauses(tags: string[], projects: string[], areas: string[]): string[] {
    const whereClauses = ['TMTask.trashed = 0', 'TMTask.type = 0'];
    if (tags.length > 0) {
      whereClauses.push(`TMTask.uuid IN (SELECT TMTaskTag.tasks FROM TMTaskTag JOIN TMTag ON TMTag.uuid = TMTaskTag.tags WHERE TMTag.title IN (${tags.map(() => '?').join(',')}))`);
    }
    if (projects.length > 0) {
      whereClauses.push(`TMProject.title IN (${projects.map(() => '?').join(',')})`);
    }
    if (areas.length > 0) {
      whereClauses.push(`TMArea.title IN (${areas.map(() => '?').join(',')})`);
    }
    whereClauses.push('TMTask.uuid NOT IN (SELECT TMTaskTag.tasks FROM TMTaskTag JOIN TMTag ON TMTag.uuid = TMTaskTag.tags WHERE TMTag.title = ?)');
    return whereClauses;
  }

  /**
   * Build the full SQL query string for fetching tasks, including joins and filters.
   *
   * @param whereClauses Array of SQL WHERE clause strings
   * @returns The full SQL query string
   */
  private buildQuery(whereClauses: string[]): string {
    return `
      SELECT
        TMTask.uuid as uuid,
        TMTask.title as title,
        TMTask.notes as notes,
        TMTask.startDate as startDate,
        TMTask.stopDate as stopDate,
        TMTask.status as status,
        TMTask.deadline as deadline,
        TMArea.title as area,
        GROUP_CONCAT(TMTag.title, ', ') as tags,
        TMProject.title as project
      FROM TMTask
        LEFT JOIN TMTaskTag ON TMTaskTag.tasks = TMTask.uuid
        LEFT JOIN TMTag ON TMTag.uuid = TMTaskTag.tags
        LEFT JOIN TMArea ON TMTask.area = TMArea.uuid
        LEFT JOIN TMTask TMProject ON TMProject.uuid = TMTask.project
      WHERE ${whereClauses.join(' AND ')}
      GROUP BY TMTask.uuid
      ORDER BY TMTask.stopDate;
    `;
  }

  /**
   * Build the array of query parameters for the SQL statement.
   *
   * @param tags Array of tag names
   * @param projects Array of project names
   * @param areas Array of area names
   * @returns Array of parameters to bind to the SQL query
   */
  private buildParams(tags: string[], projects: string[], areas: string[]): any[] {
    return [...tags, ...projects, ...areas];
  }

  /**
   * Execute the SQL query and return all result rows as objects.
   *
   * @param db sql.js Database instance
   * @param sql The SQL query string
   * @param params Array of parameters to bind
   * @returns Array of result rows (objects)
   */
  private executeQuery(db: Database, sql: string, params: any[]): any[] {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const rows: any[] = [];
    // console.log(sql);
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  }

  /**
   * Retrieve checklist items for a given task, ordered by their index.
   *
   * @param db sql.js Database instance
   * @param taskUuid UUID of the task
   * @returns Array of checklist items with title and checked status
   */
  getChecklistItemsByTask(db: Database, taskUuid: string): { title: string; checked: boolean }[] {
    const stmt = db.prepare('SELECT title, status FROM TMChecklistItem WHERE task = ? ORDER BY "index" ASC');
    stmt.bind([taskUuid]);
    const checklist: { title: string; checked: boolean }[] = [];
    while (stmt.step()) {
      const item = stmt.getAsObject();
      checklist.push({
        title: item.title,
        checked: item.status === 3 // 3 = checked, 0 = unchecked in Things3
      });
    }
    stmt.free();
    return checklist;
  }
}
