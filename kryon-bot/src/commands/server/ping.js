/**
 * ping.js
 * -------
 * Reports round-trip latency and WebSocket heartbeat latency.
 */

const { SlashCommandBuilder } = require('discord.js');
const { baseEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder().setName('ping').setDescription("Check the bot's latency."),

  async execute(interaction, client) {
    const sent = await interaction.reply({ embeds: [baseEmbed().setDescription('🏓 Pinging...')], fetchReply: true });

    const roundTrip = sent.createdTimestamp - interaction.createdTimestamp;

    await interaction.editReply({
      embeds: [
        baseEmbed()
          .setTitle('🏓 Pong!')
          .addFields(
            { name: 'Round Trip', value: `${roundTrip}ms`, inline: true },
            { name: 'WebSocket Heartbeat', value: `${client.ws.ping}ms`, inline: true }
          ),
      ],
    });
  },
};
