import { Database } from 'sql.js';
import { Things3WorkflowSettings } from '../settings';
import { CacheService } from './cacheService';

/**
 * Represents a row returned from the Things3 task query.
 */
export interface Things3TaskRow {
  uuid: string;
  title: string;
  notes: string;
  startDate: number | null;
  stopDate: number | null;
  status: number;
  deadline: number | null;
  creationDate: number | null;
  area: string | null;
  tags: string | null;
  project: string | null;
  project_area: string | null;
}

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
  getTasks(db: Database, settings: Things3WorkflowSettings, pluginCache: CacheService): Things3TaskRow[] {
    const { tags, projects, areas } = this.prepareFilters(settings);
    const { whereClauses, params } = this.buildWhereClausesAndParams(tags, projects, areas);
    const sql = this.buildQuery(whereClauses);
    const allRows = this.executeQuery(db, sql, params);
    // Filter out any rows whose UUID is in the plugin cache
    return allRows.filter(row => !pluginCache.has(row.uuid));
  }

  /**
   * Parse and prepare tag, project, and area filters from plugin settings.
   * Handles undefined or non-string values gracefully.
   *
   * @param settings Plugin settings
   * @returns Object with arrays: tags, projects, areas
   */
  private prepareFilters(settings: Things3WorkflowSettings) {
    // Defensive: ensure each filter is a string before splitting
    const safeSplit = (val: unknown) =>
      typeof val === 'string' ? val.split(',').map(t => t.trim()).filter(Boolean) : [];
    const tags = safeSplit(settings.filterTags);
    const projects = safeSplit(settings.filterProjects);
    const areas = safeSplit(settings.filterAreas);
    return { tags, projects, areas };
  }

  /**
   * Build SQL WHERE clauses and parameters for tag, project, and area filters.
   * Ensures the order and number of SQL placeholders matches the parameters array.
   *
   * @param tags Array of tag names
   * @param projects Array of project names
   * @param areas Array of area names
   * @returns Object with whereClauses and params arrays
   */
  private buildWhereClausesAndParams(tags: string[], projects: string[], areas: string[]): { whereClauses: string[]; params: string[] } {
    const whereClauses = ['TMTask.trashed = 0', 'TMTask.type = 0'];
    const params: string[] = [];
    if (tags.length > 0) {
      whereClauses.push(`TMTask.uuid IN (SELECT TMTaskTag.tasks FROM TMTaskTag JOIN TMTag ON TMTag.uuid = TMTaskTag.tags WHERE TMTag.title IN (${tags.map(() => '?').join(',')}))`);
      params.push(...tags);
    }
    if (projects.length > 0) {
      whereClauses.push(`TMProject.title IN (${projects.map(() => '?').join(',')})`);
      params.push(...projects);
    }
    if (areas.length > 0) {
      whereClauses.push(`(TMArea.title IN (${areas.map(() => '?').join(',')}) OR ProjectArea.title IN (${areas.map(() => '?').join(',')}))`);
      params.push(...areas);
      params.push(...areas);
    }
    whereClauses.push('TMTask.uuid NOT IN (SELECT TMTaskTag.tasks FROM TMTaskTag JOIN TMTag ON TMTag.uuid = TMTaskTag.tags WHERE TMTag.title = ?)');
    params.push('imported');
    return { whereClauses, params };
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
        TMTask.creationDate as creationDate,
        TMArea.title as area,
        GROUP_CONCAT(TMTag.title, ', ') as tags,
        TMProject.title as project,
        ProjectArea.title as project_area
      FROM TMTask
        LEFT JOIN TMTaskTag ON TMTaskTag.tasks = TMTask.uuid
        LEFT JOIN TMTag ON TMTag.uuid = TMTaskTag.tags
        LEFT JOIN TMArea ON TMTask.area = TMArea.uuid
        LEFT JOIN TMTask TMProject ON TMProject.uuid = TMTask.project
        LEFT JOIN TMArea ProjectArea ON ProjectArea.uuid = TMProject.area
      WHERE ${whereClauses.join(' AND ')}
      GROUP BY TMTask.uuid
      ORDER BY TMTask.stopDate;
    `;
  }

  /**
   * Execute the SQL query and return all result rows as objects.
   *
   * @param db sql.js Database instance
   * @param sql The SQL query string
   * @param params Array of parameters to bind
   * @returns Array of result rows (objects)
   */
  private executeQuery(db: Database, sql: string, params: string[]): Things3TaskRow[] {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const rows: Things3TaskRow[] = [];
    // console.log(sql);
    while (stmt.step()) {
      rows.push(stmt.getAsObject() as unknown as Things3TaskRow);
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
        title: String(item.title),
        checked: item.status === 3 // 3 = checked, 0 = unchecked in Things3
      });
    }
    stmt.free();
    return checklist;
  }
}
