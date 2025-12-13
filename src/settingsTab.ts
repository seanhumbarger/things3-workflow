import { App, PluginSettingTab, Setting } from 'obsidian';
import Things3WorkflowPlugin from './main';
import { DEFAULT_SETTINGS } from './settings';
import { PLUGIN_AUTHOR, PLUGIN_DOCS_URL, PLUGIN_ISSUE_URL, PLUGIN_BUYMECOFFEE_URL, PLUGIN_NAME, PLUGIN_DESCRIPTION } from './pluginMeta';

/**
 * Things3WorkflowSettingTab
 *
 * This class defines the settings tab UI for the Things3 Importer plugin in Obsidian.
 * It organizes all plugin configuration options into clear sections and provides a professional look and feel.
 *
 * Features:
 * - Displays plugin meta information (author, version, documentation, issue tracker).
 * - Provides a short description and a styled "Buy Me a Coffee" button.
 * - Groups settings into Database, Filters, and On Import sections for clarity.
 * - Allows users to configure database path, filters, note section headers, custom tags, and more.
 * - All settings are persisted and loaded via the plugin's settings object.
 *
 * Usage:
 * - Instantiated and registered by the main plugin class.
 * - Users interact with this tab via the Obsidian settings UI.
 *
 * @class Things3WorkflowSettingTab
 * @extends PluginSettingTab
 */
export class Things3WorkflowSettingTab extends PluginSettingTab {
  plugin: Things3WorkflowPlugin;

  /**
   * Constructs the settings tab for the plugin.
   * @param app The Obsidian app instance.
   * @param plugin The Things3 Importer plugin instance.
   */
  constructor(app: App, plugin: Things3WorkflowPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  /**
   * Renders the settings tab UI, including meta info, description, and all configuration sections.
   */
  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h1', { text: PLUGIN_NAME });

    // --- Plugin meta info section ---
    const metaDiv = containerEl.createDiv();
    metaDiv.style.display = 'flex';
    metaDiv.style.alignItems = 'center';
    metaDiv.style.justifyContent = 'space-between';
    metaDiv.style.marginBottom = '0.5em';

    // Author and version
    const leftMeta = metaDiv.createDiv();
    leftMeta.style.display = 'flex';
    leftMeta.style.flexDirection = 'column';
    leftMeta.style.gap = '0.2em';
    leftMeta.createEl('span', { text: `by ${PLUGIN_AUTHOR}`, cls: 'plugin-author' });
    leftMeta.createEl('span', { text: `Version: ${this.plugin.manifest.version}`, cls: 'plugin-version' });

    // Quick links
    const rightMeta = metaDiv.createDiv();
    rightMeta.style.display = 'flex';
    rightMeta.style.gap = '1em';
    // Documentation link
    const docLink = rightMeta.createEl('a', {
      text: 'Documentation',
      href: PLUGIN_DOCS_URL,
    });
    docLink.target = '_blank';
    docLink.rel = 'noopener';
    docLink.style.textDecoration = 'underline';
    // Issue tracker link
    const issueLink = rightMeta.createEl('a', {
      text: 'Report Issue',
      href: PLUGIN_ISSUE_URL,
    });
    issueLink.target = '_blank';
    issueLink.rel = 'noopener';
    issueLink.style.textDecoration = 'underline';

    // --- Short description ---
    const descDiv = containerEl.createDiv();
    descDiv.style.margin = '0.5em 0 1.5em 0';
    descDiv.style.fontSize = '1.05em';
    descDiv.style.color = '#555';
    descDiv.setText(PLUGIN_DESCRIPTION);

    // --- Buy Me a Coffee link styled as a button ---
    const coffeeDiv = containerEl.createDiv();
    coffeeDiv.style.display = 'flex';
    coffeeDiv.style.justifyContent = 'left';
    coffeeDiv.style.margin = '1em 0 2em 0';
    // Buy Me a Coffee button
    const coffeeLink = coffeeDiv.createEl('a', {
      text: '☕ Buy Me a Coffee',
      href: PLUGIN_BUYMECOFFEE_URL,
    });
    coffeeLink.target = '_blank';
    coffeeLink.rel = 'noopener';
    coffeeLink.style.fontWeight = 'bold';
    coffeeLink.style.fontSize = '1.15em';
    coffeeLink.style.background = '#FFDD00';
    coffeeLink.style.color = '#222';
    coffeeLink.style.padding = '0.5em 1.5em';
    coffeeLink.style.borderRadius = '24px';
    coffeeLink.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
    coffeeLink.style.textDecoration = 'none';
    coffeeLink.style.transition = 'background 0.2s';
    coffeeLink.onmouseover = () => coffeeLink.style.background = '#ffe066';
    coffeeLink.onmouseout = () => coffeeLink.style.background = '#FFDD00';
    // GitHub button styled similarly
    const githubLink = coffeeDiv.createEl('a', {
      text: '⭐ GitHub',
      href: 'https://github.com/seanhumbarger/things3-workflow',
    });
    githubLink.target = '_blank';
    githubLink.rel = 'noopener';
    githubLink.style.fontWeight = 'bold';
    githubLink.style.fontSize = '1.15em';
    githubLink.style.background = '#24292f';
    githubLink.style.color = '#fff';
    githubLink.style.padding = '0.5em 1.5em';
    githubLink.style.borderRadius = '24px';
    githubLink.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
    githubLink.style.textDecoration = 'none';
    githubLink.style.marginLeft = '1em';
    githubLink.style.transition = 'background 0.2s';
    githubLink.onmouseover = () => githubLink.style.background = '#444c56';
    githubLink.onmouseout = () => githubLink.style.background = '#24292f';

    // --- Database Section ---
    containerEl.createEl('h3', { text: 'Database' });
    new Setting(containerEl)
      .setName('Database Path')
      .setDesc('Path to your Things3 SQLite database file (auto detected if not set)')
      .addText(text => text
        .setPlaceholder('~/Library/.../main.sqlite')
        .setValue(this.plugin.settings.databasePath || DEFAULT_SETTINGS.databasePath)
        .onChange(async (value) => {
          this.plugin.settings.databasePath = value;
          await this.plugin.saveSettings();
        }));

    // --- Filters Section ---
    containerEl.createEl('h3', { text: 'Filters' });
    new Setting(containerEl)
      .setName('Filter Tags')
      .setDesc('Comma-separated list of tags to import (leave blank for all)')
      .addText(text => text
        .setValue(this.plugin.settings.filterTags || DEFAULT_SETTINGS.filterTags)
        .onChange(async (value) => {
          this.plugin.settings.filterTags = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Filter Projects')
      .setDesc('Comma-separated list of projects to import (leave blank for all)')
      .addText(text => text
        .setValue(this.plugin.settings.filterProjects || DEFAULT_SETTINGS.filterProjects)
        .onChange(async (value) => {
          this.plugin.settings.filterProjects = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Filter Areas')
      .setDesc('Comma-separated list of areas to import (leave blank for all)')
      .addText(text => text
        .setValue(this.plugin.settings.filterAreas || DEFAULT_SETTINGS.filterAreas)
        .onChange(async (value) => {
          this.plugin.settings.filterAreas = value;
          await this.plugin.saveSettings();
        }));

    // --- On Import Section ---
    containerEl.createEl('h3', { text: 'On Import' });
    new Setting(containerEl)
      .setName('Destination Folder')
      .setDesc('Folder in your vault to save imported notes (defaults to vault root if not set)')
      .addText(text => text
        .setValue(this.plugin.settings.destinationFolder || DEFAULT_SETTINGS.destinationFolder)
        .onChange(async (value) => {
          this.plugin.settings.destinationFolder = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Include Project as Tag')
      .setDesc('Add the project as a tag to imported notes.')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.includeProjectAsTag)
        .onChange(async (value) => {
          this.plugin.settings.includeProjectAsTag = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Include Area as Tag')
      .setDesc('Add the area as a tag to imported notes.')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.includeAreaAsTag)
        .onChange(async (value) => {
          this.plugin.settings.includeAreaAsTag = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Note Section Header')
      .setDesc('Header for the main note section (default: Note)')
      .addText(text => text
        .setPlaceholder('Note')
        .setValue(this.plugin.settings.noteSectionHeader || 'Note')
        .onChange(async (value) => {
          this.plugin.settings.noteSectionHeader = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Details Section Header')
      .setDesc('Header for the details section (default: Details)')
      .addText(text => text
        .setPlaceholder('Details')
        .setValue(this.plugin.settings.detailsSectionHeader || 'Details')
        .onChange(async (value) => {
          this.plugin.settings.detailsSectionHeader = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Checklist Section Header')
      .setDesc('Header for the checklist section (default: Checklist)')
      .addText(text => text
        .setPlaceholder('Checklist')
        .setValue(this.plugin.settings.checklistSectionHeader || 'Checklist')
        .onChange(async (value) => {
          this.plugin.settings.checklistSectionHeader = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Custom Tags')
      .setDesc('Comma-separated list of tags to add to every imported note (optional, de-duplicated)')
      .addText(text => text
        .setPlaceholder('imported, things3')
        .setValue((this.plugin.settings.customTags ?? DEFAULT_SETTINGS.customTags) as string)
        .onChange(async (value) => {
          this.plugin.settings.customTags = value;
          await this.plugin.saveSettings();
        }));
  }
}
