import './handler.js'
import { conn, serialize } from './lib/simple.js'
import { loadPlugins, watchPlugins } from './lib/pluginsload.js'
import { handler, PermissionChecker, welcomeBanner, ucapan } from './handler.js'
import axios from 'axios'
import lodash from 'lodash'
import fs from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

global.API = async (baseUrl, data = {}, headers = {}, method = 'get') => {
  try {
    const response = await axios({
      method: method.toLowerCase(),
      url: baseUrl,
      ...(method.toLowerCase() === 'get' ? { params: data } : { data }),
      headers
    })
    return response.data
  } catch (error) {
    console.error('Error calling API:', error)
    throw error
  }
}

var low
try {
  low = await import('lowdb')
} catch {
  low = await import('./lib/lowdb.js')
}
const { LowSync, JSONFileSync } = low
if (!fs.existsSync(global.config.databasePath)) fs.writeFileSync(global.config.databasePath, '{}')
const adapter = new JSONFileSync(global.config.databasePath)
global.db = new LowSync(adapter)

global.loadDatabase = async function loadDatabase() {
  if (global.db.READ)
    return new Promise((resolve) =>
      setInterval(function () {
        !global.db.READ
          ? (clearInterval(this),
            resolve(global.db.data == null ? global.loadDatabase() : global.db.data))
          : null
      }, 1000)
    )

  if (global.db.data !== null) return
  global.db.READ = true
  await global.db.read()
  global.db.READ = false
  global.db.data = {
    users: {},
    chats: {},
    settings: {},
    stats: {},
    ...(global.db.data || {})
  }
  global.db.chain = lodash.chain(global.db.data)
}

await loadDatabase()
if (global.config.autoSaveDB)
  setInterval(async () => {
    if (global.db.data) await global.db.write()
  }, 3000)

// ================= REGISTER PLUGINS =================
async function registerPlugins() {
  const plugins = await loadPlugins()
  Object.entries(plugins).forEach(([filename, plugin]) => {
    if (plugin && plugin.cmd && plugin.run) {
      conn.command(plugin.cmd, async (ctx) => {
        await global.loadDatabase()
        handler(ctx)

        const permissionChecker = new PermissionChecker(ctx.from.id)
        if (plugin.isOwner && !permissionChecker.isOwner()) {
          await ctx.reply('Maaf, fitur ini hanya untuk pemilik bot.')
          return
        }
        if (plugin.premium && !permissionChecker.premium()) {
          await ctx.reply('Maaf, fitur ini hanya untuk pengguna premium.')
          return
        }

        const serializedContext = serialize(ctx, conn)
        const [cmd, ...args] = ctx.message.text.split(/\s+/)
        const textAfterCommand = args.join(' ')

        try {
          await plugin.run({
            conn,
            m: serializedContext,
            prefix: global.config.prefix,
            text: textAfterCommand || undefined,
            command: cmd,
            args
          })
        } catch (e) {
          console.error(`[💥] Error executing plugin '${filename}':`, e)
          await ctx.reply('⚠️ Terjadi kesalahan saat menjalankan perintah ini.')
        }
      })
    }
  })
}

// ================= GRUP EVENT HANDLER =================
conn.on('new_chat_members', async (ctx) => {
  const chat = global.db.data.chats[ctx.chat.id] || {}
  if (!chat.welcome) return
  const member = ctx.message.new_chat_members[0]
  const name = member.first_name || 'User'
  const avatar = (await ctx.telegram.getUserProfilePhotos(member.id)).photos[0]?.[0]?.file_id
    ? await ctx.telegram.getFileLink(
        (await ctx.telegram.getUserProfilePhotos(member.id)).photos[0][0].file_id
      )
    : 'https://telegra.ph/file/1b77f1e5ed1a8d35dcf06.png'
  const banner = await welcomeBanner(avatar, name, ctx.chat.title, 'welcome')
  await ctx.replyWithPhoto({ source: banner }, { caption: `${ucapan()} ${name}! 👋` })
})

conn.on('left_chat_member', async (ctx) => {
  const chat = global.db.data.chats[ctx.chat.id] || {}
  if (!chat.leave) return
  const member = ctx.message.left_chat_member
  const name = member.first_name || 'User'
  const avatar = (await ctx.telegram.getUserProfilePhotos(member.id)).photos[0]?.[0]?.file_id
    ? await ctx.telegram.getFileLink(
        (await ctx.telegram.getUserProfilePhotos(member.id)).photos[0][0].file_id
      )
    : 'https://telegra.ph/file/1b77f1e5ed1a8d35dcf06.png'
  const banner = await welcomeBanner(avatar, name, ctx.chat.title, 'leave')
  await ctx.replyWithPhoto({ source: banner }, { caption: `Selamat jalan, ${name}! 👋` })
})

// ================= START BOT =================
conn.start((ctx) => ctx.reply(`Halo! Aku ${global.config.namebot}. Ketik /menu untuk memulai.`))
registerPlugins()
  .then(() => {
    conn.launch().then(() => {
      console.log(`🤖 ${global.config.namebot} is running...`)
      if (global.config.autoreload) watchPlugins()
    })
  })
  .catch((err) => console.error('Error loading plugins:', err))
