/**
 * deploy-commands.js
 * ------------------
 * Registers all slash commands with Discord's API.
 *
 * Run with: npm run deploy
 *
 * If GUILD_ID is set in .env, commands are registered instantly to that
 * single guild (great for development). If it's left blank, commands are
 * registered globally, which can take up to an hour to propagate but works
 * across every server the bot is in.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID) {
  console.error('[deploy] Missing DISCORD_TOKEN or CLIENT_ID in .env');
  process.exit(1);
}

function collectCommandData() {
  const commands = [];
  const commandsPath = path.join(__dirname, 'commands');
  const categories = fs.readdirSync(commandsPath);

  for (const category of categories) {
    const categoryPath = path.join(commandsPath, category);
    if (!fs.statSync(categoryPath).isDirectory()) continue;

    const files = fs.readdirSync(categoryPath).filter((f) => f.endsWith('.js'));
    for (const file of files) {
      const command = require(path.join(categoryPath, file));
      if (command.data) {
        commands.push(command.data.toJSON());
      }
    }
  }

  return commands;
}

async function deploy() {
  const commands = collectCommandData();
  const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

  try {
    console.log(`[deploy] Registering ${commands.length} slash commands...`);

    if (GUILD_ID) {
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
        body: commands,
      });
      console.log(`[deploy] Successfully registered commands to guild ${GUILD_ID}.`);
    } else {
      await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
      console.log('[deploy] Successfully registered global commands (may take up to 1hr to appear).');
    }
  } catch (err) {
    console.error('[deploy] Failed to register commands:', err);
  }
}

deploy();
