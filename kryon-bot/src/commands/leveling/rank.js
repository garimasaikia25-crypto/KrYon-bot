/**
 * rank.js
 * -------
 * Shows a member's current level, XP, and rank on the leaderboard.
 */

const { SlashCommandBuilder } = require('discord.js');
const { baseEmbed } = require('../../utils/embeds');
const db = require('../../utils/database');

const TABLE = 'levels.json';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription("Show a member's level and XP.")
    .addUserOption((opt) => opt.setName('user').setDescription('The member to check')),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const all = db.getRaw(TABLE);
    const guildData = all[interaction.guild.id] || {};
    const userData = guildData[targetUser.id] || { xp: 0, level: 0 };

    const sorted = Object.entries(guildData).sort((a, b) => b[1].xp - a[1].xp);
    const rankPosition = sorted.findIndex(([id]) => id === targetUser.id) + 1;

    const embed = baseEmbed()
      .setTitle(`${targetUser.username}'s Rank`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'Level', value: `${userData.level}`, inline: true },
        { name: 'XP', value: `${userData.xp}`, inline: true },
        { name: 'Server Rank', value: rankPosition > 0 ? `#${rankPosition}` : 'Unranked', inline: true }
      );

    await interaction.reply({ embeds: [embed] });
  },
};
