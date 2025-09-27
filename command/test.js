export default {
  cmd: ['t'],
  run: async ({ conn, m }) => {
    const chatId = m.chat;
    await conn.sendButton(chatId, "Pilih opsi:", [
      ["OK", "/ok"],
      ["Cancel", "/cancel"],
    ]);
    conn.on('callback_query', async (ctx) => {
  const data = ctx.update.callback_query.data;
  const chatId = ctx.update.callback_query.message.chat.id;
  const msgId = ctx.update.callback_query.message.message_id;

  ctx.answerCbQuery();

  if (data === "/ok") {
    await conn.editButton(chatId, msgId, "✅ Sudah diupdate", [["Done", "/done"]]);
  } else if (data === "/cancel") {
    await conn.editButton(chatId, msgId, "❌ Dibatalkan", [["Close", "/close"]]);
  }
});

  },
};
