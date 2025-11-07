import fs from 'fs'
import path, { join, dirname } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

export default {
  cmd: ['sp', 'gp', 'dp', 'ep'],
  tags: ['owner'],
  isOwner: true,
  desc: 'Menyimpan (.sp), ambil (.gp), hapus (.dp), dan edit (.ep) plugin',

  async run({ m, text, conn, command }) {
    try {
      const senderId = m.sender?.toString() || ''
      const isOwner = global.config.owner.some((o) => String(o).includes(senderId))
      if (!isOwner) return m.reply('❌ Hanya owner yang bisa menggunakan perintah ini.')

      const __dirname = dirname(fileURLToPath(import.meta.url))
      const pluginsDir = join(__dirname, '../')
      if (!text) return m.reply('Format:\n.sp folder/namafile.js (reply kode JS)')

      const fullPath = join(pluginsDir, text)
      const folder = path.dirname(fullPath)

      if (command === 'sp') {
        const replyMsg = m.quoted?.text || m.reply_message?.text
        if (!replyMsg) return m.reply('Reply ke pesan yang berisi kode plugin .js')
        if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true })
        fs.writeFileSync(fullPath, replyMsg, 'utf-8')
        m.reply(`✅ Plugin disimpan ke: ${text}\n♻️ Reloading...`)
        try {
          const module = await import(`${pathToFileURL(fullPath).href}?update=${Date.now()}`)
          const plugin = module.default || module
          if (global.plugins) global.plugins[text] = plugin
          m.reply(`✅ Plugin ${text} berhasil di-load ulang`)
        } catch (e) {
          m.reply(`❌ Gagal reload plugin:\n${e.message}`)
        }
      }

      if (command === 'gp') {
        if (!fs.existsSync(fullPath)) return m.reply('Plugin tidak ditemukan')
        const content = fs.readFileSync(fullPath, 'utf-8')
        await m.reply(`📦 Plugin: ${text}\n\n\`\`\`js\n${content}\n\`\`\``)
      }

      if (command === 'dp') {
        if (!fs.existsSync(fullPath)) return m.reply('Plugin tidak ditemukan')
        fs.unlinkSync(fullPath)
        delete global.plugins[text]
        m.reply(`🗑️ Plugin ${text} telah dihapus`)
      }

      if (command === 'ep') {
        const replyMsg = m.quoted?.text || m.reply_message?.text
        if (!replyMsg) return m.reply('Reply ke kode JS baru untuk mengganti plugin')
        if (!fs.existsSync(fullPath)) return m.reply('Plugin tidak ditemukan')
        fs.writeFileSync(fullPath, replyMsg, 'utf-8')
        m.reply(`✏️ Plugin ${text} telah diperbarui\n♻️ Reloading...`)
        try {
          const module = await import(`${pathToFileURL(fullPath).href}?update=${Date.now()}`)
          const plugin = module.default || module
          if (global.plugins) global.plugins[text] = plugin
          m.reply(`✅ Plugin ${text} berhasil di-load ulang`)
        } catch (e) {
          m.reply(`❌ Gagal reload plugin:\n${e.message}`)
        }
      }
    } catch (e) {
      m.reply(`💥 Error: ${e.message}`)
    }
  }
}
