/**
 * ban.js
 * ------
 * Bans a member from the server. Supports an optional message-deletion
 * window and reason. Logs the action and DMs the target if possible.
 */

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../../config/config.json');
const { successEmbed, errorEmbed, baseEmbed } = require('../../utils/embeds');
const { sendLog } = require('../../utils/logger');
const { canModerate } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((opt) => opt.setName('user').setDescription('The member to ban').setRequired(true))
    .addStringOption((opt) => opt.setName('reason').setDescription('Reason for the ban'))
    .addIntegerOption((opt) =>
      opt
        .setName('delete_days')
        .setDescription('Days of messages to delete (0-7)')
        .setMinValue(0)
        .setMaxValue(7)
    ),

  async execute(interaction, client) {
    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const deleteDays = interaction.options.getInteger('delete_days') || 0;

    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (targetMember) {
      const check = canModerate(interaction.member, targetMember, interaction.guild);
      if (!check.ok) {
        return interaction.reply({ embeds: [errorEmbed(check.reason)], ephemeral: true });
      }
    }

    // Best-effort DM before the ban (the target may have DMs disabled).
    await targetUser
      .send({
        embeds: [
          baseEmbed()
            .setTitle(`You were banned from ${interaction.guild.name}`)
            .addFields({ name: 'Reason', value: reason }),
        ],
      })
      .catch(() => null);

    try {
      await interaction.guild.members.ban(targetUser.id, {
        deleteMessageSeconds: deleteDays * 86400,
        reason: `${interaction.user.tag}: ${reason}`,
      });
    } catch (err) {
      console.error('[ban] Failed to ban member:', err);
      return interaction.reply({ embeds: [errorEmbed('Failed to ban that user. Check my permissions/role position.')], ephemeral: true });
    }

    await interaction.reply({ embeds: [successEmbed(`**${targetUser.tag}** was banned.\n**Reason:** ${reason}`, 'Member Banned')] });

    sendLog(
      client,
      config.moderation.logChannelId,
      baseEmbed()
        .setTitle('🔨 Ban Issued')
        .addFields(
          { name: 'User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
          { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
          { name: 'Reason', value: reason }
        )
    );
  },
};
