/**
 * lock.js
 * -------
 * Locks the current channel by denying @everyone the SendMessages
 * permission.
 */

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../../config/config.json');
const { successEmbed, errorEmbed, baseEmbed } = require('../../utils/embeds');
const { sendLog } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Lock the current channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addStringOption((opt) => opt.setName('reason').setDescription('Reason for locking')),

  async execute(interaction, client) {
    const reason = interaction.options.getString('reason') || 'No reason provided';

    try {
      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        SendMessages: false,
      });
    } catch (err) {
      console.error('[lock] Failed to lock channel:', err);
      return interaction.reply({ embeds: [errorEmbed('Failed to lock this channel. Check my permissions.')], ephemeral: true });
    }

    await interaction.reply({ embeds: [successEmbed(`🔒 ${interaction.channel} has been locked.\n**Reason:** ${reason}`)] });

    sendLog(
      client,
      config.moderation.logChannelId,
      baseEmbed()
        .setTitle('🔒 Channel Locked')
        .addFields(
          { name: 'Channel', value: `${interaction.channel}`, inline: true },
          { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
          { name: 'Reason', value: reason }
        )
    );
  },
};
