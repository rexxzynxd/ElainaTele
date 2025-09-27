import axios from "axios";
export default {
    name: 'waifu',
    cmd: ['waifu'],
    tags: 'anime',
    run: async ({ conn, m, prefix, command }) => {
        let img = await axios.get('https://api.waifu.pics/sfw/waifu');
        conn.sendButtonImg(m.chat, img.data.url, 'Sukses', [['LAGI', '/waifu'], [set.menuBtn, '/menu']], m.send);
    },
};