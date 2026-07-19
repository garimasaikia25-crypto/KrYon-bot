/**
 * suggest.js
 * ----------
 * Posts a member's suggestion to the configured suggestions channel with
 * 👍/👎 reactions for voting.
 */

const { SlashCommandBuilder } = require('discord.js');
const { baseEmbed, errorEmbed, successEmbed } = require('../../utils/embeds');
const config = require('../../../config/config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('suggest')
    .setDescription('Submit a suggestion for the server.')
    .addStringOption((opt) => opt.setName('suggestion').setDescription('Your suggestion').setRequired(true)),

  async execute(interaction) {
    const suggestion = interaction.options.getString('suggestion');
    const channelId = config.suggestions.channelId;

    if (!channelId || channelId.startsWith('PUT_')) {
      return interaction.reply({ embeds: [errorEmbed('The suggestions channel has not been configured yet.')], ephemeral: true });
    }

    const channel = interaction.guild.channels.cache.get(channelId);
    if (!channel) {
      return interaction.reply({ embeds: [errorEmbed('The configured suggestions channel could not be found.')], ephemeral: true });
    }

    const embed = baseEmbed()
      .setTitle('💡 New Suggestion')
      .setDescription(suggestion)
      .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() });

    const message = await channel.send({ embeds: [embed] });
    await message.react('👍');
    await message.react('👎');

    await interaction.reply({ embeds: [successEmbed(`Your suggestion has been posted in ${channel}.`)], ephemeral: true });
  },
};
