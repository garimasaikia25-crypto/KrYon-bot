/**
 * messageDelete.js
 * ----------------
 * Logs deleted messages (author, channel, and content) to the configured
 * message log channel. Ignores bot messages to reduce noise from the
 * ticket/transcript system deleting its own messages.
 */

const config = require('../../config/config.json');
const { baseEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'messageDelete',
  async execute(message, client) {
    if (!message.guild || message.author?.bot) return;

    const embed = baseEmbed()
      .setTitle('🗑️ Message Deleted')
      .addFields(
        { name: 'Author', value: `${message.author} (\`${message.author?.tag ?? 'Unknown'}\`)`, inline: true },
        { name: 'Channel', value: `${message.channel}`, inline: true },
        { name: 'Content', value: message.content?.slice(0, 1024) || '*(no cached content — embed/attachment only)*' }
      )
      .setFooter({ text: `Message ID: ${message.id}` });

    sendLog(client, config.logging.messageLogChannelId, embed);
  },
};
