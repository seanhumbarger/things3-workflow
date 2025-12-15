import { App, PluginSettingTab, Setting, AbstractInputSuggest, TFolder } from 'obsidian';
import Things3WorkflowPlugin from './main';
import { DEFAULT_SETTINGS } from './settings';
import { PLUGIN_AUTHOR, PLUGIN_DOCS_URL, PLUGIN_ISSUE_URL, PLUGIN_BUYMECOFFEE_URL, PLUGIN_NAME, PLUGIN_DESCRIPTION } from './pluginMeta';

/**
 * FolderSuggest
 *
 * Custom suggester for selecting folders in the vault, including root as '/'.
 * Extends AbstractInputSuggest to provide dropdown suggestions on input focus.
 */
class FolderSuggest extends AbstractInputSuggest<string> {
  private folders: string[];
  private input: HTMLInputElement;

  constructor(app: App, inputEl: HTMLInputElement) {
    super(app, inputEl);
    this.input = inputEl;
    this.folders = this.app.vault.getAllLoadedFiles()
      .filter((file): file is TFolder => file instanceof TFolder)
      .map(folder => folder.path);
  }

  getSuggestions(inputStr: string): string[] {
    const lowerCaseInputStr = inputStr.toLowerCase();
    return this.folders
      .map(path => ({ original: path, display: path === '' ? '/' : path }))
      .filter(({ display }) => display.toLowerCase().includes(lowerCaseInputStr))
      .map(({ display }) => display);
  }

  renderSuggestion(value: string, el: HTMLElement): void {
    el.setText(value);
  }

  selectSuggestion(value: string): void {
    const original = value === '/' ? '' : value;
    this.input.value = original;
    this.input.dispatchEvent(new Event('input', { bubbles: true }));
    this.close();
  }
}

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
    const descDiv = containerEl.createDiv({ cls: 'things3wf-desc' });
    descDiv.setText(PLUGIN_DESCRIPTION);

    // --- Buy Me a Coffee link styled as a button ---
    const coffeeDiv = containerEl.createDiv({ cls: 'things3wf-coffee-row' });
    // Buy Me a Coffee button
    const coffeeLink = coffeeDiv.createEl('a', {
      text: '☕ Buy Me a Coffee',
      href: PLUGIN_BUYMECOFFEE_URL,
      cls: 'things3wf-coffee-btn',
    });
    coffeeLink.target = '_blank';
    coffeeLink.rel = 'noopener';
    // GitHub button styled similarly
    const githubLink = coffeeDiv.createEl('a', {
      text: '⭐ GitHub',
      href: 'https://github.com/seanhumbarger/things3-workflow',
      cls: 'things3wf-github-btn',
    });
    githubLink.target = '_blank';
    githubLink.rel = 'noopener';
    githubLink.style.marginLeft = '1em'; // Only margin, as this is layout, not theme

    // --- Database Section ---
    new Setting(containerEl).setName('Database').setHeading();
    new Setting(containerEl)
      .setName('Database path')
      .setDesc('Path to your things3 sqlite database file (auto detected if not set)')
      .addText(text => text
        .setPlaceholder('~/Library/.../main.sqlite')
        .setValue(this.plugin.settings.databasePath || DEFAULT_SETTINGS.databasePath)
        .onChange(async (value) => {
          this.plugin.settings.databasePath = value;
          await this.plugin.saveSettings();
        }));

    // --- Filters Section ---
    new Setting(containerEl).setName('Filters').setHeading();
    new Setting(containerEl)
      .setName('Tags')
      .setDesc('Comma-separated list of tags to import (leave blank for all)')
      .addText(text => text
        .setValue(this.plugin.settings.filterTags || DEFAULT_SETTINGS.filterTags)
        .onChange(async (value) => {
          this.plugin.settings.filterTags = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Projects')
      .setDesc('Comma-separated list of projects to import (leave blank for all)')
      .addText(text => text
        .setValue(this.plugin.settings.filterProjects || DEFAULT_SETTINGS.filterProjects)
        .onChange(async (value) => {
          this.plugin.settings.filterProjects = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Areas')
      .setDesc('Comma-separated list of areas to import (leave blank for all)')
      .addText(text => text
        .setValue(this.plugin.settings.filterAreas || DEFAULT_SETTINGS.filterAreas)
        .onChange(async (value) => {
          this.plugin.settings.filterAreas = value;
          await this.plugin.saveSettings();
        }));

    // --- On Import Section ---
    new Setting(containerEl).setName('Import').setHeading();
    new Setting(containerEl)
      .setName('Destination folder')
      .setDesc('Folder in your vault to save imported notes (defaults to vault root if not set)')
      .addSearch(search => {
        search
          .setPlaceholder('Example: folder/subfolder (or / for root)')
          .setValue(this.plugin.settings.destinationFolder || DEFAULT_SETTINGS.destinationFolder)
          .onChange(async (value) => {
            this.plugin.settings.destinationFolder = value;
            await this.plugin.saveSettings();
          });
        new FolderSuggest(this.app, search.inputEl);
      });

    new Setting(containerEl)
      .setName('Include project as tag')
      .setDesc('Add the project as a tag to imported notes.')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.includeProjectAsTag)
        .onChange(async (value) => {
          this.plugin.settings.includeProjectAsTag = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Include area as tag')
      .setDesc('Add the area as a tag to imported notes.')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.includeAreaAsTag)
        .onChange(async (value) => {
          this.plugin.settings.includeAreaAsTag = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Note section header')
      .setDesc('Header for the main note section')
      .addText(text => text
        .setPlaceholder('Note')
        .setValue(this.plugin.settings.noteSectionHeader || 'Note')
        .onChange(async (value) => {
          this.plugin.settings.noteSectionHeader = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Details section header')
      .setDesc('Header for the details section')
      .addText(text => text
        .setPlaceholder('Details')
        .setValue(this.plugin.settings.detailsSectionHeader || 'Details')
        .onChange(async (value) => {
          this.plugin.settings.detailsSectionHeader = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Checklist section header')
      .setDesc('Header for the checklist section')
      .addText(text => text
        .setPlaceholder('Checklist')
        .setValue(this.plugin.settings.checklistSectionHeader || 'Checklist')
        .onChange(async (value) => {
          this.plugin.settings.checklistSectionHeader = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Custom tags')
      .setDesc('Comma-separated list of tags to add to every imported note')
      .addText(text => text
        .setValue((this.plugin.settings.customTags ?? DEFAULT_SETTINGS.customTags) as string)
        .onChange(async (value) => {
          this.plugin.settings.customTags = value;
          await this.plugin.saveSettings();
        }));
  }
}
