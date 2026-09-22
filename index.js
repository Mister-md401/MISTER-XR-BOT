const express = require("express");
const path = require("path");
const pino = require("pino");

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const config = require("./config");


const { loadCommands } = require("./lib/commandHandler");

const commands = loadCommands();


global.MISTER_XR_COMMANDS = commands;

const app = express();

app.use(express.json());

let sock = null;
let connecting = false;

/* =========================
   WEBSITE
========================= */

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "pair.html"));
});

/* =========================
   PAIRING API
========================= */

app.get("/api/pair", async (req, res) => {

  try {

    let number = String(req.query.number || "");

    number = number.replace(/\D/g, "");

    if (!number) {
      return res.status(400).json({
        error: "Mete yon nimewo WhatsApp."
      });
    }

    if (number.length < 7) {
      return res.status(400).json({
        error: "Nimewo a twò kout."
      });
    }

    console.log("");
    console.log("================================");
    console.log("📱 PAIRING REQUEST");
    console.log("================================");
    console.log("📞 Number:", number);

    /*
     * Si bot la poko gen socket,
     * kreye socket la.
     */

    if (!sock) {
      await startBot();
    }

    /*
     * Pairing Code pa itilize
     * sou yon session ki deja registered.
     */

    if (sock.authState?.creds?.registered) {

      return res.status(400).json({
        error:
          "Session sa a deja konekte. " +
          "Efase session lan si ou vle fè yon nouvo pairing."
      });

    }

    console.log("🔑 M ap mande Pairing Code...");

    const code =
      await sock.requestPairingCode(number);

    console.log("");
    console.log("================================");
    console.log("✅ PAIRING CODE");
    console.log("================================");
    console.log("📞 Number:", number);
    console.log("🔐 Code:", code);
    console.log("================================");

    return res.json({
      success: true,
      code: code,
      number: number,
      message:
        "Pairing Code jwenn. Antre kòd la nan WhatsApp."
    });

  } catch (error) {

    console.log("");
    console.log("❌ PAIRING ERROR");
    console.log(error.message);

    return res.status(500).json({
      success: false,
      error:
        error.message ||
        "Server la pa kapab bay Pairing Code la."
    });

  }

});


/* =========================
   START WHATSAPP
========================= */

async function startBot() {

  if (connecting) {
    return;
  }

  connecting = true;

  try {

    const {
      state,
      saveCreds
    } = await useMultiFileAuthState(
      "./session"
    );

    sock = makeWASocket({

      auth: state,

      printQRInTerminal: false,

      logger: pino({
        level: "silent"
      }),

      browser: [
        "MISTER XR BOT",
        "Chrome",
        "1.0.0"
      ]

    });

    /*
     * Save session credentials
     */

    sock.ev.on(
      "creds.update",
      saveCreds
    );


    /* =========================
       CONNECTION
    ========================= */

    sock.ev.on(
      "connection.update",
      async (update) => {

        const {
          connection,
          lastDisconnect
        } = update;


        if (connection === "connecting") {

          console.log(
            "🔄 WhatsApp: connecting..."
          );

        }


        if (connection === "open") {

          console.log("");
          console.log(
            "================================"
          );
          console.log(
            "✅ MISTER XR BOT CONNECTED"
          );
          console.log(
            "================================"
          );

          connecting = false;

        }


        if (connection === "close") {

          connecting = false;

          sock = null;

          const statusCode =
            lastDisconnect?.error
              ?.output
              ?.statusCode;

          console.log(
            "🔌 WhatsApp connection closed:",
            statusCode || "unknown"
          );

          /*
           * Reconnect si itilizatè a
           * pa t logout.
           */

          if (
            statusCode !==
            DisconnectReason.loggedOut
          ) {

            console.log(
              "🔄 M ap reconnect..."
            );

            setTimeout(() => {
              startBot();
            }, 5000);

          } else {

            console.log(
              "🚪 Session lan logout."
            );

          }

        }

      }
    );


    /* =========================
       MESSAGES
    ========================= */

    sock.ev.on(
  "messages.upsert",
  async ({ messages }) => {

    const msg = messages[0];

    if (!msg || !msg.message) {
      return;
    }

    const remoteJid = msg.key.remoteJid;

    if (!remoteJid) {
      return;
    }

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    if (!text) {
      return;
    }

    console.log("📩 Message:", text);

    /*
    ==============================
    COMMAND SYSTEM
    ==============================
    */

    if (!text.startsWith(config.prefix)) {
      return;
    }

    const commandText =
      text
        .slice(config.prefix.length)
        .trim();

    if (!commandText) {
      return;
    }

    const parts =
      commandText.split(/\s+/);

    const commandName =
      parts.shift().toLowerCase();

    const args = parts;

    console.log(
      "⚡ Command:",
      commandName
    );

    /*
    ==============================
    🔥 AUTOMATIC REACTION
    ==============================
    */

    if (
      config.reaction &&
      config.reaction.enabled
    ) {

      try {

        await sock.sendMessage(
          remoteJid,
          {
            react: {
              text: config.reaction.emoji,
              key: msg.key
            }
          }
        );

      } catch (error) {

        console.log(
          "⚠️ Reaction error:",
          error.message
        );

      }

    }

    /*
    ==============================
    FIND COMMAND
    ==============================
    */

    const command =
      commands.get(commandName);

    if (!command) {

      await sock.sendMessage(
        remoteJid,
        {
          text:
            `❌ Command ".${commandName}" pa egziste.\n\n` +
            `💡 Ekri ${config.prefix}menu pou wè commands yo.`
        }
      );

      return;
    }

    /*
    ==============================
    EXECUTE COMMAND
    ==============================
    */

    try {

      await command.execute(
        sock,
        msg,
        args
      );

      console.log(
        `✅ Executed: .${commandName}`
      );

    } catch (error) {

      console.log(
        `❌ Error in .${commandName}:`,
        error
      );

      await sock.sendMessage(
        remoteJid,
        {
          text:
            `❌ Erè pandan .${commandName}\n\n` +
            `${error.message}`
        }
      );

    }

  }
);