/**
 * ready.js
 * --------
 * Fires once when the bot successfully logs in. Used to set the bot's
 * presence/status and print a startup confirmation.
 */

const { ActivityType } = require('discord.js');
const config = require('../../config/config.json');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`[ready] Logged in as ${client.user.tag}`);
    console.log(`[ready] Serving ${client.guilds.cache.size} guild(s).`);

    client.user.setPresence({
      activities: [{ name: `/help | ${config.botName}`, type: ActivityType.Watching }],
      status: 'online',
    });
  },
};
