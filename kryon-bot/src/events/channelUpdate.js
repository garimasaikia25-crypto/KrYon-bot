/**
 * channelUpdate.js
 * ----------------
 * Logs notable channel changes (name, topic) to the server log channel.
 */

const config = require('../../config/config.json');
const { baseEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'channelUpdate',
  async execute(oldChannel, newChannel, client) {
    if (!newChannel.guild) return;

    const changes = [];
    if (oldChannel.name !== newChannel.name) {
      changes.push(`**Name:** \`${oldChannel.name}\` → \`${newChannel.name}\``);
    }
    if (oldChannel.topic !== newChannel.topic) {
      changes.push(`**Topic changed**`);
    }

    if (changes.length === 0) return;

    const embed = baseEmbed()
      .setTitle('🔧 Channel Updated')
      .setDescription(`${newChannel} (\`${newChannel.id}\`)\n\n${changes.join('\n')}`);

    sendLog(client, config.logging.serverLogChannelId, embed);
  },
};
