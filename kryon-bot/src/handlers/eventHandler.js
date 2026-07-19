/**
 * eventHandler.js
 * ---------------
 * Loads every file in /events and registers it against the appropriate
 * discord.js client event.
 *
 * Each event file must export:
 *   {
 *     name: string,        // the discord.js event name (e.g. "guildMemberAdd")
 *     once: boolean,       // optional, defaults to false
 *     execute: async (...args, client) => {}
 *   }
 */

const fs = require('fs');
const path = require('path');

function loadEvents(client) {
  const eventsPath = path.join(__dirname, '..', 'events');
  const eventFiles = fs.readdirSync(eventsPath).filter((f) => f.endsWith('.js'));

  let loaded = 0;

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);

    if (!event.name || !event.execute) {
      console.warn(`[eventHandler] Skipping invalid event file: ${filePath}`);
      continue;
    }

    const listener = (...args) => event.execute(...args, client);

    if (event.once) {
      client.once(event.name, listener);
    } else {
      client.on(event.name, listener);
    }

    loaded += 1;
  }

  console.log(`[eventHandler] Loaded ${loaded} events.`);
}

module.exports = { loadEvents };
