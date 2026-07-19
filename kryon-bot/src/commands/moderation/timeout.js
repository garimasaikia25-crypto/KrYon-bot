/**
 * timeout.js
 * ----------
 * Times out (mutes) a member for a specified duration using Discord's
 * native timeout feature.
 */

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../../config/config.json');
const { successEmbed, errorEmbed, baseEmbed } = require('../../utils/embeds');
const { sendLog } = require('../../utils/logger');
const { canModerate } = require('../../utils/permissions');

const DURATION_CHOICES = [
  { name: '60 seconds', value: 60 },
  { name: '5 minutes', value: 300 },
  { name: '10 minutes', value: 600 },
  { name: '1 hour', value: 3600 },
  { name: '1 day', value: 86400 },
  { name: '1 week', value: 604800 },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout (mute) a member for a set duration.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((opt) => opt.setName('user').setDescription('The member to timeout').setRequired(true))
    .addIntegerOption((opt) =>
      opt
        .setName('duration')
        .setDescription('Timeout duration')
        .setRequired(true)
        .addChoices(...DURATION_CHOICES)
    )
    .addStringOption((opt) => opt.setName('reason').setDescription('Reason for the timeout')),

  async execute(interaction, client) {
    const targetUser = interaction.options.getUser('user');
    const durationSeconds = interaction.options.getInteger('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!targetMember) {
      return interaction.reply({ embeds: [errorEmbed('That user is not a member of this server.')], ephemeral: true });
    }

    const check = canModerate(interaction.member, targetMember, interaction.guild);
    if (!check.ok) {
      return interaction.reply({ embeds: [errorEmbed(check.reason)], ephemeral: true });
    }

    try {
      await targetMember.timeout(durationSeconds * 1000, `${interaction.user.tag}: ${reason}`);
    } catch (err) {
      console.error('[timeout] Failed to timeout member:', err);
      return interaction.reply({ embeds: [errorEmbed('Failed to timeout that user. Check my permissions/role position.')], ephemeral: true });
    }

    const readableDuration = DURATION_CHOICES.find((c) => c.value === durationSeconds)?.name ?? `${durationSeconds}s`;

    await interaction.reply({
      embeds: [successEmbed(`**${targetUser.tag}** was timed out for **${readableDuration}**.\n**Reason:** ${reason}`, 'Member Timed Out')],
    });

    sendLog(
      client,
      config.moderation.logChannelId,
      baseEmbed()
        .setTitle('🔇 Timeout Issued')
        .addFields(
          { name: 'User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
          { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
          { name: 'Duration', value: readableDuration, inline: true },
          { name: 'Reason', value: reason }
        )
    );
  },
};
