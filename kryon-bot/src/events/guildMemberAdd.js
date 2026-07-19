/**
 * guildMemberAdd.js
 * -----------------
 * Handles new members joining the server:
 *   - Sends a welcome embed (mentions user, shows account age, member count).
 *   - Sends a separate "welcome back" message if they've been seen before.
 *   - Assigns the configured auto-role, if any.
 *   - Logs the join to the member log channel.
 */

const config = require('../../config/config.json');
const { baseEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');
const db = require('../utils/database');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    const { guild, user } = member;

    // --- Auto role -----------------------------------------------------
    const autoRoleId = config.welcome.autoRoleId;
    if (autoRoleId && !autoRoleId.startsWith('PUT_')) {
      const role = guild.roles.cache.get(autoRoleId);
      if (role) {
        await member.roles.add(role).catch((err) =>
          console.error('[guildMemberAdd] Failed to assign auto-role:', err)
        );
      }
    }

    // --- Rejoin detection ------------------------------------------------
    const isRejoin = db.markMemberSeen(guild.id, user.id);

    // --- Welcome message -------------------------------------------------
    if (config.welcome.enabled) {
      const channelId = config.welcome.channelId;
      if (channelId && !channelId.startsWith('PUT_')) {
        const channel = guild.channels.cache.get(channelId);
        if (channel) {
          const accountCreated = `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`;

          const embed = baseEmbed()
            .setTitle(
              isRejoin && config.welcome.welcomeBackEnabled
                ? `👋 Welcome back, ${user.username}!`
                : `🎉 Welcome to ${guild.name}!`
            )
            .setDescription(
              isRejoin && config.welcome.welcomeBackEnabled
                ? `${member} has rejoined the server. Glad to have you back!`
                : `${member} just joined the server. Make yourself at home!`
            )
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
              { name: 'Account Created', value: accountCreated, inline: true },
              { name: 'Member Count', value: `${guild.memberCount}`, inline: true }
            );

          channel.send({ content: `${member}`, embeds: [embed] }).catch((err) =>
            console.error('[guildMemberAdd] Failed to send welcome message:', err)
          );
        }
      }
    }

    // --- Log --------------------------------------------------------------
    const logEmbed = baseEmbed()
      .setTitle('📥 Member Joined')
      .setDescription(`${member} (\`${user.tag}\`) joined the server.`)
      .addFields(
        { name: 'Account Age', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'Rejoin', value: isRejoin ? 'Yes' : 'No', inline: true }
      )
      .setThumbnail(user.displayAvatarURL({ dynamic: true }));

    sendLog(client, config.logging.memberLogChannelId, logEmbed);
  },
};
