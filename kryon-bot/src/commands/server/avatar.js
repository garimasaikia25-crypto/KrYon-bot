/**
 * avatar.js
 * ---------
 * Displays a user's avatar at full resolution.
 */

const { SlashCommandBuilder } = require('discord.js');
const { baseEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription("Show a user's avatar.")
    .addUserOption((opt) => opt.setName('user').setDescription('The user whose avatar to show')),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const url = targetUser.displayAvatarURL({ dynamic: true, size: 1024 });

    const embed = baseEmbed().setTitle(`${targetUser.tag}'s Avatar`).setImage(url);

    await interaction.reply({ embeds: [embed] });
  },
};
