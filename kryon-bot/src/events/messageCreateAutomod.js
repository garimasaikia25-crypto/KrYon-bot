/**
 * messageCreateAutomod.js
 * -------------------------
 * Lightweight AutoMod: filters invite links, excessive mentions, excessive
 * caps, and a configurable banned-word list. Deletes the offending message
 * and logs the action. Staff and configured ignored channels/roles are
 * exempt.
 *
 * This complements (does not replace) Discord's native AutoMod, which can
 * still be configured separately in Server Settings for more advanced
 * rules (spam detection, mention raid protection, etc.).
 */

const config = require('../../config/config.json');
const { baseEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');

const INVITE_REGEX = /(discord\.gg|discord\.com\/invite|discordapp\.com\/invite)\/\S+/i;

function isExempt(message) {
  const settings = config.automod;
  if (settings.ignoredChannelIds?.includes(message.channel.id)) return true;
  if (message.member?.roles.cache.some((r) => settings.ignoredRoleIds?.includes(r.id))) return true;
  if (message.member?.permissions.has('ManageMessages')) return true;
  return false;
}

function getCapsPercent(content) {
  const letters = content.replace(/[^a-zA-Z]/g, '');
  if (letters.length < 10) return 0; // ignore short messages
  const caps = letters.replace(/[^A-Z]/g, '');
  return (caps.length / letters.length) * 100;
}

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    const settings = config.automod;
    if (!settings?.enabled) return;
    if (!message.guild || message.author.bot) return;
    if (isExempt(message)) return;

    let violation = null;

    if (settings.blockInviteLinks && INVITE_REGEX.test(message.content)) {
      violation = 'Posted a Discord invite link';
    } else if (settings.maxMentions && message.mentions.users.size > settings.maxMentions) {
      violation = `Mentioned too many users (${message.mentions.users.size})`;
    } else if (settings.maxCapsPercent && getCapsPercent(message.content) > settings.maxCapsPercent) {
      violation = 'Excessive use of capital letters';
    } else if (settings.bannedWords?.length) {
      const lower = message.content.toLowerCase();
      const matched = settings.bannedWords.find((w) => lower.includes(w.toLowerCase()));
      if (matched) violation = 'Used a banned word';
    }

    if (!violation) return;

    await message.delete().catch(() => null);

    message
      .reply({
        embeds: [baseEmbed().setDescription(`${message.author}, your message was removed: **${violation}**`)],
      })
      .then((reply) => setTimeout(() => reply.delete().catch(() => null), 6000))
      .catch(() => null);

    sendLog(
      client,
      config.logging.serverLogChannelId,
      baseEmbed()
        .setTitle('🤖 AutoMod Action')
        .addFields(
          { name: 'User', value: `${message.author} (\`${message.author.tag}\`)`, inline: true },
          { name: 'Channel', value: `${message.channel}`, inline: true },
          { name: 'Violation', value: violation },
          { name: 'Original Content', value: message.content.slice(0, 1000) || '*(empty)*' }
        )
    );
  },
};
