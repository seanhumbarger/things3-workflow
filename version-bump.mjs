import fs from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const manifestPath = join(__dirname, 'manifest.json');
const versionsPath = join(__dirname, 'versions.json');
const indexPath = join(__dirname, 'docs-site', 'docs', '_index.md');

async function main() {
  try {
    const manifestContent = await fs.readFile(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);

    const versionsContent = await fs.readFile(versionsPath, 'utf8');
    const versions = JSON.parse(versionsContent);

    const currentVersion = manifest.version;
    console.log(`Current version: ${currentVersion}`);

    const newVersion = await prompt('Enter new version: ');

    if (!newVersion) {
      console.error('No version provided. Aborting.');
      process.exit(1);
    }

    manifest.version = newVersion;
    versions[newVersion] = manifest.minAppVersion;

    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, '\t') + '\n');
    await fs.writeFile(versionsPath, JSON.stringify(versions, null, '\t') + '\n');

    // Update docs-site/docs/_index.md version line
    let indexContent = await fs.readFile(indexPath, 'utf8');
    indexContent = indexContent.replace(
      /(- \*\*Latest version:\*\* )([0-9]+\.[0-9]+\.[0-9]+)/,
      `$1${newVersion}`
    );
    await fs.writeFile(indexPath, indexContent);

    console.log(`Version bumped to ${newVersion}. Files updated.`);
  } catch (error) {
    console.error('Error during version bump:', error);
    process.exit(1);
  }
}

function prompt(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.once('data', (data) => {
      resolve(data.toString().trim());
    });
  });
}

main();
