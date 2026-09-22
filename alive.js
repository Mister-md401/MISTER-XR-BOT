module.exports = {
  name: "alive",

  description: "Verifye si bot la vivan.",

  async execute(sock, msg, args) {

    const jid = msg.key.remoteJid;

    await sock.sendMessage(jid, {
      text:
        "✅ MISTER XR BOT IS ALIVE\n\n" +
        "🔥 Bot la aktif."
    });
  }
};