import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readdirSync, statSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function toUpper(query) {
  return query
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getAllPlugins(dir) {
  const files = readdirSync(dir)
  let plugins = []
  for (const file of files) {
    const fullPath = join(dir, file)
    if (statSync(fullPath).isDirectory()) {
      plugins = plugins.concat(getAllPlugins(fullPath))
    } else if (file.endsWith('.js')) {
      plugins.push(fullPath)
    }
  }
  return plugins
}

export default {
  name: 'menu',
  cmd: ['menu'],
  tags: 'main',
  desc: 'Menampilkan daftar perintah bot',
  run: async ({ conn, m, prefix }) => {
    try {
      const pluginsFolder = join(__dirname, '../')
      const pluginFiles = getAllPlugins(pluginsFolder)

      const allCommands = []
      for (const file of pluginFiles) {
        const module = await import(`file:///${file}?update=${Date.now()}`)
        const commandModule = module.default || module
        if (commandModule && commandModule.cmd) allCommands.push(commandModule)
      }

      let menuText = `👋 Hai ${m.pushName || 'User'}!\nSelamat datang di *${global.config.namebot}*\n\n`
      menuText += `📚 *Informasi Bot:*\n`
      menuText += `🧩 Versi: ${global.config.versi}\n`
      menuText += `🪄 Library: Telegraf\n`
      menuText += `💻 Server: Localhost\n`
      menuText += `👑 Owner: @${global.config.owner}\n\n`
      menuText += `🅟 : Fitur Premium\n🅛 : Memakai Limit\n`
      menuText += `───────────────────────\n\n`

      const grouped = {}
      for (const cmd of allCommands) {
        const tag = toUpper(cmd.tags || 'Other')
        if (!grouped[tag]) grouped[tag] = []
        grouped[tag].push(
          cmd.cmd.map(c => `${prefix}${c}`).join(' / ')
        )
      }

      for (const [tag, cmds] of Object.entries(grouped)) {
        menuText += `⦿ *${tag}*\n${cmds.join('\n')}\n\n`
      }

      const buttons = [
        ['🌐 Github', 'https://github.com/RexxHayanasi'],
        [global.config.infoBtn, '/info'],
        [global.config.menuBtn, '/menu']
      ]

      await conn.sendButtonUrl(m.chat, menuText.trim(), buttons, m.send)

    } catch (error) {
      console.error(error)
      m.reply('Terjadi kesalahan saat menampilkan menu.')
    }
  }
          }
