import { serialize } from './lib/simple.js'
import moment from 'moment-timezone'
import canvafy from 'canvafy'

global.set = global.config

function isNumber(x) {
  return typeof x === 'number' && !isNaN(x)
}

export const handler = function handler(ctx) {
  const m = serialize(ctx)
  try {
    let user = db.data.users[m.sender]
    if (typeof user !== 'object') db.data.users[m.sender] = {}
    if (user) {
      if (!isNumber(user.healt)) user.healt = 0
      if (!isNumber(user.level)) user.level = 0
      if (!isNumber(user.exp)) user.exp = 0
      if (!isNumber(user.money)) user.money = 0
      if (!isNumber(user.coin)) user.coin = 0
      if (!isNumber(user.lastdaily)) user.lastdaily = 0
      if (!isNumber(user.lastweekly)) user.lastweekly = 0
      if (!isNumber(user.lastmonthly)) user.lastmonthly = 0
      if (!isNumber(user.apel)) user.apel = 0
      if (!isNumber(user.roti)) user.roti = 0
      if (!isNumber(user.gold_ticket)) user.gold_ticket = 0
      if (!isNumber(user.blue_ticket)) user.blue_ticket = 0
    } else {
      global.db.data.users[m.sender] = {
        healt: 100,
        level: 0,
        exp: 0,
        money: 0,
        coin: 0,
        lastdaily: 0,
        lastweekly: 0,
        lastmonthly: 0,
        apel: 0,
        roti: 0,
        gold_ticket: 0,
        blue_ticket: 0
      }
    }

    let chat = global.db.data.chats[m.chat]
    if (typeof chat !== 'object') global.db.data.chats[m.chat] = {}
    if (chat) {
      if (!('welcome' in chat)) chat.welcome = false
      if (!('leave' in chat)) chat.leave = false
    } else {
      global.db.data.chats[m.chat] = { welcome: false, leave: false }
    }

    let settings = global.db.data.settings[ctx.botInfo.id]
    if (typeof settings !== 'object') global.db.data.settings[ctx.botInfo.id] = {}
    if (settings) {
      if (!('self' in settings)) settings.self = false
    } else {
      global.db.data.settings[ctx.botInfo.id] = { self: false }
    }
    global.db.write()
  } catch (e) {
    console.error(e)
  }
}

// ======== SYSTEM UCAPAN & BANNER ========
export function ucapan() {
  const time = moment.tz('Asia/Jakarta').format('HH')
  if (time >= 4 && time < 10) return 'Selamat Pagi'
  if (time >= 10 && time < 15) return 'Selamat Siang'
  if (time >= 15 && time < 18) return 'Selamat Sore'
  return 'Selamat Malam'
}

export async function welcomeBanner(avatar, name, subject, type) {
  const title = (type === 'welcome' ? 'Halo, ' : 'Sayonara, ') + name
  const desc = (type === 'welcome' ? 'Selamat datang di ' : 'Keluar dari ') + subject
  const background = [
    'https://pomf2.lain.la/f/miskhj5i.jpg',
    'https://pomf2.lain.la/f/lfo1en8.png'
  ]
  const img = await new canvafy.WelcomeLeave()
    .setAvatar(avatar)
    .setBackground('image', background[Math.floor(Math.random() * background.length)])
    .setTitle(title.length > 20 ? title.substring(0, 16) + '..' : title)
    .setDescription(desc.length > 70 ? desc.substring(0, 65) + '..' : desc)
    .setBorder('#2a2e35')
    .setAvatarBorder('#2a2e35')
    .setOverlayOpacity(0.3)
    .build()
  return img
}

// ======== PERMISSION CHECKER ========
export class PermissionChecker {
  constructor(userId) {
    this.userId = String(userId)
  }

  isOwner() {
    return global.config.owner.some((o) => String(o).includes(this.userId))
  }

  premium() {
    const user = global.db.data.users[this.userId]
    return user?.premium || false
  }
      }
