const fs = require("fs");
const path = require("path");

function loadCommands() {
  const commands = new Map();

  const commandsPath = path.join(
    __dirname,
    "..",
    "commands"
  );

  if (!fs.existsSync(commandsPath)) {
    console.log("⚠️ Folder commands pa egziste.");
    return commands;
  }

  const files = fs
    .readdirSync(commandsPath)
    .filter(file => file.endsWith(".js"));

  console.log("");
  console.log("================================");
  console.log("📦 MISTER XR COMMAND LOADER");
  console.log("================================");

  for (const file of files) {
    try {
      const command = require(
        path.join(commandsPath, file)
      );

      if (
        !command.name ||
        typeof command.execute !== "function"
      ) {
        console.log(
          `⚠️ Command invalide: ${file}`
        );
        continue;
      }

      commands.set(
        command.name.toLowerCase(),
        command
      );

      if (Array.isArray(command.aliases)) {
        for (const alias of command.aliases) {
          commands.set(
            alias.toLowerCase(),
            command
          );
        }
      }

      console.log(
        `✅ Loaded: .${command.name}`
      );

    } catch (error) {
      console.log(
        `❌ Erè nan ${file}: ${error.message}`
      );
    }
  }

  console.log("================================");
  console.log(
    `📊 Commands loaded: ${files.length}`
  );
  console.log("================================");
  console.log("");

  return commands;
}

module.exports = {
  loadCommands
};