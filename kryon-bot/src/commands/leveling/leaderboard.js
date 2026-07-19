/**
 * leaderboard.js
 * --------------
 * Shows the top 10 members by XP in the server.
 */

const { SlashCommandBuilder } = require('discord.js');
const { baseEmbed } = require('../../utils/embeds');
const db = require('../../utils/database');

const TABLE = 'levels.json';

module.exports = {
  data: new SlashCommandBuilder().setName('leaderboard').setDescription('Show the server XP leaderboard.'),

  async execute(interaction) {
    const all = db.getRaw(TABLE);
    const guildData = all[interaction.guild.id] || {};

    const sorted = Object.entries(guildData)
      .sort((a, b) => b[1].xp - a[1].xp)
      .slice(0, 10);

    const embed = baseEmbed().setTitle(`🏆 ${interaction.guild.name} Leaderboard`);

    if (sorted.length === 0) {
      embed.setDescription('No one has earned any XP yet.');
    } else {
      embed.setDescription(
        sorted.map(([userId, data], i) => `**#${i + 1}** <@${userId}> — Level ${data.level} (${data.xp} XP)`).join('\n')
      );
    }

    await interaction.reply({ embeds: [embed] });
  },
};
