/**
 * unlock.js
 * ---------
 * Unlocks the current channel by restoring @everyone's SendMessages
 * permission (resets the overwrite to neutral/inherit).
 */

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../../config/config.json');
const { successEmbed, errorEmbed, baseEmbed } = require('../../utils/embeds');
const { sendLog } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Unlock the current channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction, client) {
    try {
      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        SendMessages: null,
      });
    } catch (err) {
      console.error('[unlock] Failed to unlock channel:', err);
      return interaction.reply({ embeds: [errorEmbed('Failed to unlock this channel. Check my permissions.')], ephemeral: true });
    }

    await interaction.reply({ embeds: [successEmbed(`🔓 ${interaction.channel} has been unlocked.`)] });

    sendLog(
      client,
      config.moderation.logChannelId,
      baseEmbed()
        .setTitle('🔓 Channel Unlocked')
        .addFields(
          { name: 'Channel', value: `${interaction.channel}`, inline: true },
          { name: 'Moderator', value: `${interaction.user.tag}`, inline: true }
        )
    );
  },
};
