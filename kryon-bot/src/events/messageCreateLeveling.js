/**
 * messageCreateLeveling.js
 * --------------------------
 * Awards XP for messages sent (with a per-user cooldown to prevent
 * spam-leveling) and announces level-ups. Filename is distinct from
 * messageCreateAutomod.js, but both register on the same 'messageCreate'
 * event — Node's EventEmitter supports multiple listeners per event, so
 * splitting unrelated concerns into separate files keeps each one focused.
 */

const config = require('../../config/config.json');
const { baseEmbed } = require('../utils/embeds');
const db = require('../utils/database');

const TABLE = 'levels.json';
const xpCooldowns = new Map(); // userId -> timestamp when eligible again

/** Standard XP curve: level N requires 5*(N^2) + 50*N + 100 total XP. */
function xpForLevel(level) {
  return 5 * level * level + 50 * level + 100;
}

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (!config.leveling?.enabled) return;
    if (!message.guild || message.author.bot) return;

    const now = Date.now();
    const cooldownKey = `${message.guild.id}-${message.author.id}`;
    const cooldownExpires = xpCooldowns.get(cooldownKey) || 0;
    if (now < cooldownExpires) return;

    xpCooldowns.set(cooldownKey, now + (config.leveling.xpCooldownSeconds || 60) * 1000);

    const [min, max] = config.leveling.xpPerMessage || [15, 25];
    const gainedXp = Math.floor(Math.random() * (max - min + 1)) + min;

    const all = db.getRaw(TABLE);
    all[message.guild.id] = all[message.guild.id] || {};
    const userData = all[message.guild.id][message.author.id] || { xp: 0, level: 0 };

    userData.xp += gainedXp;

    let leveledUp = false;
    while (userData.xp >= xpForLevel(userData.level)) {
      userData.xp -= xpForLevel(userData.level);
      userData.level += 1;
      leveledUp = true;
    }

    all[message.guild.id][message.author.id] = userData;
    db.setRaw(TABLE, all);

    if (leveledUp) {
      const announceChannelId = config.leveling.levelUpChannelId || message.channel.id;
      const channel = message.guild.channels.cache.get(announceChannelId) || message.channel;

      channel
        .send({
          embeds: [
            baseEmbed()
              .setTitle('🎉 Level Up!')
              .setDescription(`${message.author} reached **Level ${userData.level}**!`),
          ],
        })
        .catch((err) => console.error('[leveling] Failed to send level-up message:', err));
    }
  },
};
