module.exports = {
  botName: "MISTER XR BOT",
  ownerName: "MISTER XR",

  prefix: ".",

  port: process.env.PORT || 3000,

  pairing: {
    enabled: true
  },

  reaction: {
    enabled: true,
    emoji: "🔥"
  },

  commands: {
    target: 400
  }
};