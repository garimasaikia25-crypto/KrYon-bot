/**
 * messageUpdate.js
 * ----------------
 * Logs message edits (before/after content) to the configured message log
 * channel.
 */

const config = require('../../config/config.json');
const { baseEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'messageUpdate',
  async execute(oldMessage, newMessage, client) {
    if (!newMessage.guild || newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return; // e.g. embed load, no real edit

    const embed = baseEmbed()
      .setTitle('✏️ Message Edited')
      .addFields(
        { name: 'Author', value: `${newMessage.author} (\`${newMessage.author?.tag ?? 'Unknown'}\`)`, inline: true },
        { name: 'Channel', value: `${newMessage.channel}`, inline: true },
        { name: 'Before', value: oldMessage.content?.slice(0, 1024) || '*(unknown)*' },
        { name: 'After', value: newMessage.content?.slice(0, 1024) || '*(unknown)*' }
      )
      .setURL(newMessage.url)
      .setFooter({ text: `Message ID: ${newMessage.id}` });

    sendLog(client, config.logging.messageLogChannelId, embed);
  },
};
