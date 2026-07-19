/**
 * verifysetup.js
 * ---------------
 * Posts a "Verify" button panel. Clicking it grants the configured
 * verified role, gating access to the rest of the server behind a
 * simple one-click check (useful for basic bot/raid protection).
 */

const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { baseEmbed, successEmbed, errorEmbed } = require('../../utils/embeds');
const config = require('../../../config/config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verifysetup')
    .setDescription('Post the verification panel in this channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const roleId = config.verification?.roleId;
    if (!roleId || roleId.startsWith('PUT_')) {
      return interaction.reply({
        embeds: [errorEmbed('Set `verification.roleId` in config.json before running this command.')],
        ephemeral: true,
      });
    }

    const embed = baseEmbed()
      .setTitle('✅ Verify Yourself')
      .setDescription('Click the button below to verify and gain access to the rest of the server.');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('verify_button').setLabel('Verify').setEmoji('✅').setStyle(ButtonStyle.Success)
    );

    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ embeds: [successEmbed('Verification panel posted.')], ephemeral: true });
  },
};
