/**
 * clearwarnings.js
 * ----------------
 * Wipes a member's warning history.
 */

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../../config/config.json');
const { successEmbed } = require('../../utils/embeds');
const { sendLog } = require('../../utils/logger');
const { baseEmbed } = require('../../utils/embeds');
const db = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clearwarnings')
    .setDescription("Clear a member's warning history.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((opt) => opt.setName('user').setDescription('The member to clear warnings for').setRequired(true)),

  async execute(interaction, client) {
    const targetUser = interaction.options.getUser('user');
    db.clearWarnings(interaction.guild.id, targetUser.id);

    await interaction.reply({ embeds: [successEmbed(`Cleared all warnings for **${targetUser.tag}**.`)] });

    sendLog(
      client,
      config.moderation.logChannelId,
      baseEmbed()
        .setTitle('🧹 Warnings Cleared')
        .addFields(
          { name: 'User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
          { name: 'Moderator', value: `${interaction.user.tag}`, inline: true }
        )
    );
  },
};
