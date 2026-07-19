/**
 * guildMemberRemove.js
 * --------------------
 * Handles members leaving the server: sends a goodbye embed to the
 * configured channel and logs the departure.
 */

const config = require('../../config/config.json');
const { baseEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member, client) {
    const { guild, user } = member;

    if (config.welcome.enabled) {
      const channelId = config.welcome.goodbyeChannelId;
      if (channelId && !channelId.startsWith('PUT_')) {
        const channel = guild.channels.cache.get(channelId);
        if (channel) {
          const embed = baseEmbed()
            .setTitle(`👋 ${user.username} has left the server`)
            .setDescription(`We now have **${guild.memberCount}** members.`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }));

          channel.send({ embeds: [embed] }).catch((err) =>
            console.error('[guildMemberRemove] Failed to send goodbye message:', err)
          );
        }
      }
    }

    const logEmbed = baseEmbed()
      .setTitle('📤 Member Left')
      .setDescription(`\`${user.tag}\` (${user.id}) left the server.`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }));

    sendLog(client, config.logging.memberLogChannelId, logEmbed);
  },
};
