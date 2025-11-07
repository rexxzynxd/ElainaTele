// main.js
import './handler.js';
import { conn, serialize } from './lib/simple.js';
import { loadPlugins, watchPlugins } from './lib/pluginsload.js';
import { handler, PermissionChecker } from './handler.js';
import axios from 'axios';
import lodash from 'lodash';
import fs from 'fs';

// ================= GLOBAL API =================
global.API = async (baseUrl, data = {}, headers = {}, method = 'get') => {
  try {
    const response = await axios({
      method: method.toLowerCase(),
      url: baseUrl,
      ...(method.toLowerCase() === 'get' ? { params: data } : { data }),
      headers,
    });
    return response.data;
  } catch (error) {
    console.error('Error calling API:', error);
    throw error;
  }
};

// ================= DATABASE =================
var low;
try {
  low = await import('lowdb');
} catch {
  low = await import('./lib/lowdb.js');
}
const { LowSync, JSONFileSync } = low;
if (!fs.existsSync('./database.json')) fs.writeFileSync('./database.json', '{}');
const adapter = new JSONFileSync('./database.json');
global.db = new LowSync(adapter);

global.loadDatabase = async function loadDatabase() {
  if (global.db.READ)
    return new Promise((resolve) =>
      setInterval(function () {
        !global.db.READ
          ? (clearInterval(this),
            resolve(global.db.data == null ? global.loadDatabase() : global.db.data))
          : null;
      }, 1000)
    );

  if (global.db.data !== null) return;
  global.db.READ = true;
  await global.db.read();
  global.db.READ = false;
  global.db.data = {
    users: {},
    chats: {},
    settings: {},
    stats: {},
    ...(global.db.data || {}),
  };
  global.db.chain = lodash.chain(global.db.data);
};

loadDatabase();
if (global.db)
  setInterval(async () => {
    if (global.db.data) await global.db.write();
  }, 3000);

// ================= REGISTER PLUGINS =================
async function registerPlugins() {
  const plugins = await loadPlugins();

  Object.entries(plugins).forEach(([filename, plugin]) => {
    if (plugin && plugin.cmd && plugin.run) {
      conn.command(plugin.cmd, async (ctx) => {
        await global.loadDatabase();
        handler(ctx);

        const permissionChecker = new PermissionChecker(ctx.from.id.toString());
        if (plugin.isOwner && !permissionChecker.isOwner()) {
          await ctx.reply('Maaf, fitur ini hanya untuk pemilik bot.');
          return;
        }
        if (plugin.premium && !permissionChecker.premium()) {
          await ctx.reply('Maaf, fitur ini hanya untuk pengguna premium.');
          return;
        }

        const serializedContext = serialize(ctx, conn);
        const [cmd, ...args] = ctx.message.text.split(/\s+/);
        const textAfterCommand = args.join(' ');

        try {
          await plugin.run({
            conn,
            m: serializedContext,
            prefix: '/',
            text: textAfterCommand || undefined,
            command: cmd,
            args,
          });
        } catch (e) {
          console.error(`[💥] Error executing plugin '${filename}':`, e);
          await ctx.reply('⚠️ Terjadi kesalahan saat menjalankan perintah ini.');
        }
      });
    }
  });
}

// ================= BOT STARTUP =================
conn.start((ctx) => {
  ctx.reply('Halo! Aku adalah Elaina BotTele. Cobalah kirim pesan /menu');
});

registerPlugins()
  .then(() => {
    conn.launch().then(() => {
      console.log('🤖 Bot is running...');
      watchPlugins(); // 👀 aktifkan watcher auto reload
    });
  })
  .catch((err) => {
    console.error('Error loading plugins:', err);
  });
