/**
 * index.js
 * --------
 * Entry point for the KrYon Discord bot.
 * Responsibilities:
 *   1. Load environment variables.
 *   2. Create the Discord client with the required gateway intents.
 *   3. Load commands and events via the handlers.
 *   4. Register global error handling.
 *   5. Log in.
 */

require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');

const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');
const { registerErrorHandlers } = require('./handlers/errorHandler');
const { startGiveawayScheduler } = require('./features/giveaways/manager');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // needed for welcome/goodbye + moderation
    GatewayIntentBits.GuildMessages, // needed for message logging
    GatewayIntentBits.MessageContent, // needed to log message content on edit/delete
    GatewayIntentBits.GuildModeration, // ban events
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildMember],
});

// Register global error handling before anything else can throw.
registerErrorHandlers(client);

// Load slash commands into client.commands and bind event listeners.
loadCommands(client);
loadEvents(client);

if (!process.env.DISCORD_TOKEN) {
  console.error(
    '[index] Missing DISCORD_TOKEN environment variable. Copy .env.example to .env and fill it in.'
  );
  process.exit(1);
}

client.once('ready', () => startGiveawayScheduler(client));

client.login(process.env.DISCORD_TOKEN);
