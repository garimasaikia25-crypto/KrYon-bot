/**
 * rules.js
 * --------
 * Displays the server rules, configured as a list in config.json.
 */

const { SlashCommandBuilder } = require('discord.js');
const { baseEmbed } = require('../../utils/embeds');
const config = require('../../../config/config.json');

module.exports = {
  data: new SlashCommandBuilder().setName('rules').setDescription('Show the server rules.'),

  async execute(interaction) {
    const rulesList = config.links.rules.map((rule, i) => `**${i + 1}.** ${rule}`).join('\n');

    const embed = baseEmbed().setTitle(`📜 ${interaction.guild.name} Rules`).setDescription(rulesList);

    await interaction.reply({ embeds: [embed] });
  },
};
