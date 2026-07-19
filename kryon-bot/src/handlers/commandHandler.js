/**
 * commandHandler.js
 * -----------------
 * Recursively walks the /commands directory, loads every command file, and
 * stores it in the client's `commands` Collection (keyed by command name).
 *
 * Each command file must export:
 *   { data: SlashCommandBuilder, execute: async (interaction, client) => {} }
 *
 * Adding a new command is as simple as dropping a new file into the
 * appropriate /commands/<category> folder - no manual registration needed
 * here. You still need to run `npm run deploy` to register new slash
 * commands with Discord's API.
 */

const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');

function loadCommands(client) {
  client.commands = new Collection();

  const commandsPath = path.join(__dirname, '..', 'commands');
  const categoryFolders = fs.readdirSync(commandsPath);

  let loaded = 0;

  for (const category of categoryFolders) {
    const categoryPath = path.join(commandsPath, category);
    if (!fs.statSync(categoryPath).isDirectory()) continue;

    const commandFiles = fs
      .readdirSync(categoryPath)
      .filter((file) => file.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = path.join(categoryPath, file);
      const command = require(filePath);

      if (!command.data || !command.execute) {
        console.warn(`[commandHandler] Skipping invalid command file: ${filePath}`);
        continue;
      }

      command.category = category; // used by /help to group commands
      client.commands.set(command.data.name, command);
      loaded += 1;
    }
  }

  console.log(`[commandHandler] Loaded ${loaded} slash commands.`);
}

module.exports = { loadCommands };
