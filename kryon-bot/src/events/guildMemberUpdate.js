/**
 * guildMemberUpdate.js
 * --------------------
 * Logs role changes and timeout changes for members. Timeouts issued via
 * the /timeout command are already logged by that command directly, but
 * this also catches timeouts/role edits made manually through Discord's
 * native UI, keeping the audit trail complete.
 */

const config = require('../../config/config.json');
const { baseEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'guildMemberUpdate',
  async execute(oldMember, newMember, client) {
    // --- Role changes ------------------------------------------------
    const addedRoles = newMember.roles.cache.filter((r) => !oldMember.roles.cache.has(r.id));
    const removedRoles = oldMember.roles.cache.filter((r) => !newMember.roles.cache.has(r.id));

    if (addedRoles.size > 0 || removedRoles.size > 0) {
      const lines = [];
      if (addedRoles.size > 0) lines.push(`**Added:** ${addedRoles.map((r) => r).join(', ')}`);
      if (removedRoles.size > 0) lines.push(`**Removed:** ${removedRoles.map((r) => r).join(', ')}`);

      const embed = baseEmbed()
        .setTitle('🎭 Member Roles Updated')
        .setDescription(`${newMember} (\`${newMember.user.tag}\`)\n\n${lines.join('\n')}`);

      sendLog(client, config.logging.memberLogChannelId, embed);
    }

    // --- Timeout changes -----------------------------------------------
    const oldTimeout = oldMember.communicationDisabledUntilTimestamp;
    const newTimeout = newMember.communicationDisabledUntilTimestamp;

    if (oldTimeout !== newTimeout) {
      const embed = baseEmbed()
        .setTitle(newTimeout ? '🔇 Member Timed Out' : '🔊 Member Timeout Removed')
        .setDescription(
          newTimeout
            ? `${newMember} is timed out until <t:${Math.floor(newTimeout / 1000)}:F>.`
            : `${newMember}'s timeout was removed.`
        );

      sendLog(client, config.moderation.logChannelId, embed);
    }
  },
};
