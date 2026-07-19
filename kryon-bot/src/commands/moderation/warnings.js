/**
 * warnings.js
 * -----------
 * Lists all warnings on record for a given member.
 */

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { baseEmbed } = require('../../utils/embeds');
const db = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription("View a member's warning history.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((opt) => opt.setName('user').setDescription('The member to check').setRequired(true)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');
    const warnings = db.getWarnings(interaction.guild.id, targetUser.id);

    const embed = baseEmbed().setTitle(`Warnings for ${targetUser.tag}`);

    if (warnings.length === 0) {
      embed.setDescription('This member has no warnings on record.');
    } else {
      embed.setDescription(
        warnings
          .map(
            (w) =>
              `**#${w.id}** — <t:${Math.floor(w.timestamp / 1000)}:R>\n> **Reason:** ${w.reason}\n> **Moderator:** <@${w.moderatorId}>`
          )
          .join('\n\n')
      );
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
