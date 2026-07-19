/**
 * guildBanAdd.js
 * --------------
 * Logs bans to the moderation log channel. This fires regardless of
 * whether the ban happened via the /ban command or manually through
 * Discord's UI, so it acts as a source-of-truth audit trail.
 */

const config = require('../../config/config.json');
const { baseEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'guildBanAdd',
  async execute(ban, client) {
    let reason = 'No reason provided';
    try {
      const auditLogs = await ban.guild.fetchAuditLogs({ type: 22, limit: 5 }); // 22 = MEMBER_BAN_ADD
      const entry = auditLogs.entries.find((e) => e.target.id === ban.user.id);
      if (entry?.reason) reason = entry.reason;
    } catch (err) {
      console.error('[guildBanAdd] Failed to fetch audit logs:', err);
    }

    const embed = baseEmbed()
      .setTitle('🔨 Member Banned')
      .setDescription(`\`${ban.user.tag}\` (${ban.user.id}) was banned.`)
      .addFields({ name: 'Reason', value: reason })
      .setThumbnail(ban.user.displayAvatarURL({ dynamic: true }));

    sendLog(client, config.moderation.logChannelId, embed);
  },
};
