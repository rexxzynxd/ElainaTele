import './config.js'
import './handler.js'
import { conn, serialize } from './lib/simple.js'
import { loadPlugins, watchPlugins } from './lib/pluginsload.js'
import { handler, PermissionChecker, welcomeBanner } from './handler.js'
import axios from 'axios'
import lodash from 'lodash'
import fs from 'fs'

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
  global.db.data = { users: {}, chats: {}, settings: {}, stats: {}, ...(global.db.data || {}) }
  global.db.chain = lodash.chain(global.db.data)
}

loadDatabase()
if (global.config.autoSaveDB)
  setInterval(async () => {
    if (global.db.data) await global.db.write()
  }, 3000)

async function registerPlugins() {
  const plugins = await loadPlugins()
  Object.entries(plugins).forEach(([filename, plugin]) => {
    if (plugin && plugin.cmd && plugin.run) {
      conn.command(plugin.cmd, async (ctx) => {
        await global.loadDatabase()
        handler(ctx)
        const permissionChecker = new PermissionChecker(ctx.from.id.toString())
        if (plugin.isOwner && !permissionChecker.isOwner())
          return ctx.reply('❌ Hanya pemilik bot yang bisa menggunakan fitur ini.')
        if (plugin.premium && !permissionChecker.premium())
          return ctx.reply('🔒 Fitur khusus pengguna premium.')
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
          await ctx.reply('⚠️ Terjadi kesalahan saat menjalankan perintah.')
        }
      })
    }
  })
}

conn.start((ctx) => {
  ctx.reply(`👋 Halo! Aku *${global.config.namebot}*.\nGunakan /menu untuk melihat daftar fitur.`)
})

registerPlugins()
  .then(() => {
    conn.launch().then(() => {
      console.log(`🤖 ${global.config.namebot} v${global.config.versi} is running...`)
      if (global.config.autoreload) watchPlugins()
    })
  })
  .catch((err) => {
    console.error('Error loading plugins:', err)
  })

conn.on('chat_member', async (ctx) => {
  try {
    const chatId = ctx.chat.id
    const chat = global.db.data.chats[chatId] || {}
    const member = ctx.update.chat_member.new_chat_member
    const oldMember = ctx.update.chat_member.old_chat_member
    if (oldMember.status === 'left' && member.status === 'member') {
      if (!chat.welcome) return
      const name = member.user.first_name || member.user.username || 'User'
      const avatar = await ctx.telegram
        .getUserProfilePhotos(member.user.id)
        .then((v) => v.photos[0]?.[0]?.file_id || null)
        .catch(() => null)
      const avatarUrl = avatar ? await ctx.telegram.getFileLink(avatar) : ''
      const banner = await welcomeBanner(avatarUrl, name, ctx.chat.title, 'welcome')
      await ctx.replyWithPhoto({ source: banner }, { caption: chat.sWelcome || `👋 Selamat datang ${name}!` })
    }
    if (oldMember.status === 'member' && member.status === 'left') {
      if (!chat.leave) return
      const name = oldMember.user.first_name || oldMember.user.username || 'User'
      const avatar = await ctx.telegram
        .getUserProfilePhotos(oldMember.user.id)
        .then((v) => v.photos[0]?.[0]?.file_id || null)
        .catch(() => null)
      const avatarUrl = avatar ? await ctx.telegram.getFileLink(avatar) : ''
      const banner = await welcomeBanner(avatarUrl, name, ctx.chat.title, 'leave')
      await ctx.replyWithPhoto({ source: banner }, { caption: chat.sBye || `👋 Selamat tinggal ${name}!` })
    }
  } catch (e) {
    console.error('Error handling chat_member event:', e)
  }
})
