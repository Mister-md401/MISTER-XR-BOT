module.exports = {
  name: "menu",

  aliases: ["help", "commands"],

  description: "Montre tout commands bot la.",

  async execute(sock, msg, args) {

    const jid = msg.key.remoteJid;

    const commandMap =
      global.MISTER_XR_COMMANDS;

    if (!commandMap) {
      await sock.sendMessage(jid, {
        text:
          "❌ Command list pa disponib."
      });

      return;
    }

    const uniqueCommands = [];

    for (const [name, command] of commandMap) {

      if (!uniqueCommands.includes(command)) {
        uniqueCommands.push(command);
      }

    }

    let menu =
      "╭━━━〔 🤖 MISTER XR BOT 〕━━━╮\n" +
      "┃\n";

    menu +=
      `┃ 👑 Owner : MISTER XR\n` +
      `┃ ⚡ Prefix : .\n` +
      `┃ 🔥 Commands : ${uniqueCommands.length}\n` +
      "┃\n";

    menu +=
      "┣━━━〔 📋 COMMANDS 〕━━━┫\n";

    for (const command of uniqueCommands) {

      menu +=
        `┃ 🔹 .${command.name}`;

      if (
        command.description
      ) {
        menu +=
          ` — ${command.description}`;
      }

      menu += "\n";
    }

    menu +=
      "┃\n" +
      "╰━━━━━━━━━━━━━━━━━━━━╯";

    await sock.sendMessage(jid, {
      text: menu
    });

  }
};