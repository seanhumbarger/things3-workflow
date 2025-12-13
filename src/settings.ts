/**
 * Settings interface and defaults for the Things3 Obsidian Importer plugin.
 *
 * This interface defines all configurable options available to users via the plugin settings UI.
 * Each property is documented with its purpose and expected value.
 */
export interface Things3WorkflowSettings {
  /** Path to the Things3 SQLite database file. */
  databasePath: string;

  /** Comma-separated list of tags to filter imported tasks (leave blank for all). */
  filterTags: string;

  /** Comma-separated list of projects to filter imported tasks (leave blank for all). */
  filterProjects: string;

  /** Comma-separated list of areas to filter imported tasks (leave blank for all). */
  filterAreas: string;

  /** Folder in the vault to save imported notes (optional). */
  destinationFolder: string;

  /** If true, add the project as a tag to imported notes. */
  includeProjectAsTag: boolean;

  /** If true, add the area as a tag to imported notes. */
  includeAreaAsTag: boolean;

  /** Section header for the main note section (default: 'Note'). */
  noteSectionHeader?: string;

  /** Section header for the details section (default: 'Details'). */
  detailsSectionHeader?: string;

  /** Section header for the checklist section (default: 'Checklist'). */
  checklistSectionHeader?: string;

  /** Comma-separated custom tags to add to every imported note (optional). */
  customTags?: string;
}

/**
 * Default values for all plugin settings.
 * These are used when the plugin is first installed or when a setting is reset.
 */
export const DEFAULT_SETTINGS: Things3WorkflowSettings = {
  databasePath: '',
  filterTags: '',
  filterProjects: '',
  filterAreas: '',
  destinationFolder: 'things3',
  includeProjectAsTag: true,
  includeAreaAsTag: true,
  noteSectionHeader: 'Note',
  detailsSectionHeader: 'Details',
  checklistSectionHeader: 'Checklist',
  customTags: '',
};
