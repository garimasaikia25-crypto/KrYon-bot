/**
 * slowmode.js
 * -----------
 * Sets (or clears) slowmode/rate-limit-per-user on the current channel.
 */

const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Set slowmode for the current channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption((opt) =>
      opt
        .setName('seconds')
        .setDescription('Slowmode delay in seconds (0 to disable, max 21600)')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(21600)
    ),

  async execute(interaction) {
    const seconds = interaction.options.getInteger('seconds');

    if (interaction.channel.type !== ChannelType.GuildText && interaction.channel.type !== ChannelType.GuildAnnouncement) {
      return interaction.reply({ embeds: [errorEmbed('Slowmode can only be set on text channels.')], ephemeral: true });
    }

    try {
      await interaction.channel.setRateLimitPerUser(seconds);
    } catch (err) {
      console.error('[slowmode] Failed to set slowmode:', err);
      return interaction.reply({ embeds: [errorEmbed('Failed to set slowmode. Check my permissions.')], ephemeral: true });
    }

    await interaction.reply({
      embeds: [
        successEmbed(
          seconds === 0
            ? `Slowmode has been disabled in ${interaction.channel}.`
            : `Slowmode set to **${seconds}s** in ${interaction.channel}.`
        ),
      ],
    });
  },
};
