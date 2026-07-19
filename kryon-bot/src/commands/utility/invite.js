/**
 * invite.js
 * ---------
 * Sends the server's Discord invite link (configured in config.json).
 */

const { SlashCommandBuilder } = require('discord.js');
const { baseEmbed } = require('../../utils/embeds');
const config = require('../../../config/config.json');

module.exports = {
  data: new SlashCommandBuilder().setName('invite').setDescription("Get the server's invite link."),

  async execute(interaction) {
    const embed = baseEmbed().setTitle('📨 Server Invite').setDescription(`[Click here to invite friends!](${config.links.inviteUrl})`);

    await interaction.reply({ embeds: [embed] });
  },
};
