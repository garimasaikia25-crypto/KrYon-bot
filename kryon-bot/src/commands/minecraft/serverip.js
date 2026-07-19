/**
 * serverip.js
 * -----------
 * Sends an embed with the Minecraft server's connection details, pulled
 * straight from config.json so staff can update the IP/version without
 * touching code.
 */

const { SlashCommandBuilder } = require('discord.js');
const { baseEmbed } = require('../../utils/embeds');
const config = require('../../../config/config.json');

module.exports = {
  data: new SlashCommandBuilder().setName('serverip').setDescription('Get the Minecraft server IP and connection info.'),

  async execute(interaction) {
    const mc = config.minecraft;

    const embed = baseEmbed()
      .setTitle('⛏ Minecraft Server')
      .addFields(
        { name: 'Server IP', value: `\`${mc.ip}\``, inline: true },
        { name: 'Version', value: mc.version, inline: true },
        { name: 'Java Edition', value: mc.java ? '✅ Supported' : '❌ Not Supported', inline: true },
        {
          name: 'Bedrock Edition',
          value: mc.bedrock ? `✅ Supported (Port: \`${mc.bedrockPort}\`)` : '❌ Not Supported',
          inline: true,
        },
        { name: 'Discord Invite', value: mc.discordInvite }
      )
      .setThumbnail(interaction.guild?.iconURL({ dynamic: true }) ?? null);

    await interaction.reply({ embeds: [embed] });
  },
};
