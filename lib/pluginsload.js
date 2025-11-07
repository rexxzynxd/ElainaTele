import { readdirSync, readFileSync, watch, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import syntaxerror from 'syntax-error';
import { format } from 'util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pluginFolder = join(__dirname, '../plugins');

export async function loadPlugins() {
  const folders = readdirSync(pluginFolder, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  const plugins = {};

  for (const folder of folders) {
    const files = readdirSync(join(pluginFolder, folder)).filter((f) => f.endsWith('.js'));
    for (const file of files) {
      const filePath = join(pluginFolder, folder, file);
      try {
        const module = await import(`${pathToFileURL(filePath).href}?update=${Date.now()}`);
        const plugin = module.default || module;
        plugins[`${folder}/${file}`] = plugin;
        console.log(`[✅] Loaded plugin: ${folder}/${file}`);
      } catch (err) {
        console.error(`[❌] Failed to load plugin: ${folder}/${file}\n`, err);
      }
    }
  }

  global.plugins = plugins;
  return plugins;
}

global.reload = async (_ev, filename) => {
  if (!filename.endsWith('.js')) return;

  const fullPath = join(pluginFolder, filename);
  const exists = existsSync(fullPath);

  if (!exists) {
    console.warn(`[🗑️] Plugin deleted: ${filename}`);
    delete global.plugins[filename];
    return;
  }

  const err = syntaxerror(readFileSync(fullPath), filename, {
    sourceType: 'module',
    allowAwaitOutsideFunction: true,
  });

  if (err) {
    console.error(`[⚠️] Syntax error in plugin '${filename}':\n${format(err)}`);
    return;
  }

  try {
    console.log(`[♻️] Reloading plugin '${filename}'`);
    const module = await import(`${pathToFileURL(fullPath).href}?update=${Date.now()}`);
    const plugin = module.default || module;
    global.plugins[filename] = plugin;
  } catch (e) {
    console.error(`[💥] Error reloading plugin '${filename}':\n${format(e)}`);
  }

  global.plugins = Object.fromEntries(
    Object.entries(global.plugins).sort(([a], [b]) => a.localeCompare(b))
  );
};

export function watchPlugins() {
  watch(pluginFolder, { recursive: true }, global.reload);
  console.log('👀 Watching plugin folder for changes...');
}
