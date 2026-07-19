/**
 * report.js
 * ---------
 * Lets a member privately report another user (e.g. rule violations) to
 * the configured reports channel, visible only to staff.
 */

const { SlashCommandBuilder } = require('discord.js');
const { baseEmbed, errorEmbed, successEmbed } = require('../../utils/embeds');
const config = require('../../../config/config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('report')
    .setDescription('Report a user to the staff team.')
    .addUserOption((opt) => opt.setName('user').setDescription('The user you are reporting').setRequired(true))
    .addStringOption((opt) => opt.setName('reason').setDescription('Why are you reporting this user?').setRequired(true)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');
    const channelId = config.reports.channelId;

    if (!channelId || channelId.startsWith('PUT_')) {
      return interaction.reply({ embeds: [errorEmbed('The reports channel has not been configured yet.')], ephemeral: true });
    }

    const channel = interaction.guild.channels.cache.get(channelId);
    if (!channel) {
      return interaction.reply({ embeds: [errorEmbed('The configured reports channel could not be found.')], ephemeral: true });
    }

    const embed = baseEmbed()
      .setTitle('🚨 New Report')
      .addFields(
        { name: 'Reported User', value: `${targetUser} (\`${targetUser.tag}\`)`, inline: true },
        { name: 'Reported By', value: `${interaction.user} (\`${interaction.user.tag}\`)`, inline: true },
        { name: 'Reason', value: reason }
      );

    await channel.send({ embeds: [embed] });
    await interaction.reply({ embeds: [successEmbed('Your report has been submitted to the staff team.')], ephemeral: true });
  },
};
