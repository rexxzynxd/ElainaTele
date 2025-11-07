import chalk from 'chalk'
import moment from 'moment-timezone'

export default async function printMessage(ctx) {
  try {
    const from = ctx.from
    const chat = ctx.chat
    const msg = ctx.message || ctx.update?.message || {}
    const time = moment().tz('Asia/Jakarta').format('HH:mm:ss')
    const name = from.first_name ? `${from.first_name}${from.last_name ? ' ' + from.last_name : ''}` : 'Unknown'
    const chatType = chat.type === 'private' ? 'Private Chat' : chat.title || 'Group'
    const messageText =
      msg.text || msg.caption || (msg.sticker ? '[Sticker]' : msg.photo ? '[Photo]' : msg.document ? '[Document]' : '[Unknown Message]')
    console.log(
      `${chalk.cyanBright(`[${time}]`)} ${chalk.greenBright(name)} ${chalk.gray(`(@${from.username || from.id})`)} ${chalk.yellow('->')} ${chalk.magenta(chatType)}\n` +
      `${chalk.white(messageText)}\n`
    )
  } catch (e) {
    console.error('Error in print.js logger:', e)
  }
}
