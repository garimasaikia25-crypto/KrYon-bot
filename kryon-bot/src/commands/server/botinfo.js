/**
 * botinfo.js
 * ----------
 * Displays statistics about the bot itself (uptime, guild count, ping,
 * memory usage, version).
 */

const { SlashCommandBuilder, version: djsVersion } = require('discord.js');
const { baseEmbed } = require('../../utils/embeds');
const config = require('../../../config/config.json');

function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / (1000 * 60)) % 60;
  const hours = Math.floor(ms / (1000 * 60 * 60)) % 24;
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

module.exports = {
  data: new SlashCommandBuilder().setName('botinfo').setDescription('Show information about the bot.'),

  async execute(interaction, client) {
    const memoryMb = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

    const embed = baseEmbed()
      .setTitle(`${config.botName} - Bot Info`)
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'Servers', value: `${client.guilds.cache.size}`, inline: true },
        { name: 'Users (cached)', value: `${client.users.cache.size}`, inline: true },
        { name: 'Uptime', value: formatUptime(client.uptime), inline: true },
        { name: 'Memory Usage', value: `${memoryMb} MB`, inline: true },
        { name: 'discord.js', value: `v${djsVersion}`, inline: true },
        { name: 'Node.js', value: process.version, inline: true }
      );

    await interaction.reply({ embeds: [embed] });
  },
};
