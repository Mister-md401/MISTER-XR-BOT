module.exports = {
  name: "ping",

  aliases: ["p"],

  description: "Teste si bot la aktif.",

  async execute(sock, msg, args) {

    const jid = msg.key.remoteJid;

    await sock.sendMessage(jid, {
      text:
        "🏓 PONG!\n\n" +
        "🤖 MISTER XR BOT\n" +
        "🔥 Command system OK!"
    });
  }
};