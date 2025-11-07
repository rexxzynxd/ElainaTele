import { Telegraf } from 'telegraf'
import '../config.js'

const conn = new Telegraf(global.config.tokenbot)

conn.sendMessage = async (chatId, text, quoted) => {
  return conn.telegram.sendMessage(chatId, text, { reply_to_message_id: quoted })
}

conn.sendImage = async (chatId, input, caption = '', quoted, options = {}) => {
  const isUrl = /^https?:\/\//i.test(input)
  const media = isUrl ? input : { source: Buffer.from(input) }
  return conn.telegram.sendPhoto(chatId, media, {
    caption,
    reply_to_message_id: quoted,
    ...options
  })
}

conn.sendVideo = async (chatId, input, caption = '', quoted, options = {}) => {
  const isUrl = /^https?:\/\//i.test(input)
  const media = isUrl ? input : { source: Buffer.from(input) }
  return conn.telegram.sendVideo(chatId, media, {
    caption,
    reply_to_message_id: quoted,
    ...options
  })
}

conn.sendAudio = async (chatId, buffer, caption = '', quoted, options = {}) => {
  return conn.telegram.sendAudio(chatId, { source: Buffer.from(buffer) }, {
    caption,
    reply_to_message_id: quoted,
    ...options
  })
}

conn.sendDocument = async (chatId, buffer, filename = 'file.txt', caption = '', quoted, options = {}) => {
  return conn.telegram.sendDocument(chatId, { source: Buffer.from(buffer), filename }, {
    caption,
    reply_to_message_id: quoted,
    ...options
  })
}

conn.sendButtonUrl = async (chatId, caption, buttons, quoted, options = {}) => {
  const inline = {
    inline_keyboard: buttons.map(([text, url]) => [{ text, url }])
  }
  return conn.telegram.sendMessage(chatId, caption, {
    reply_to_message_id: quoted,
    reply_markup: inline,
    ...options
  })
}

export function serialize(ctx, conn) {
  return {
    conn,
    chat: ctx.chat?.id,
    sender: ctx.from?.id,
    username: ctx.from?.username,
    pushName: ctx.from?.first_name || ctx.from?.username,
    reply: (text, options) =>
      conn.telegram.sendMessage(ctx.chat.id, text, {
        reply_to_message_id: ctx.message?.message_id,
        ...options
      })
  }
}

export { conn }
