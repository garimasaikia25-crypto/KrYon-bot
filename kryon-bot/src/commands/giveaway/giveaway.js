/**
 * giveaway.js
 * -----------
 * /giveaway start <prize> <duration_minutes> <winners>
 * /giveaway end <message_id>
 *
 * Giveaways are stored in giveaways.json and checked every 30s by the
 * scheduler started in features/giveaways/manager.js (wired up in index.js)
 * so they still end on time even if no one interacts with them.
 */

const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { baseEmbed, successEmbed, errorEmbed } = require('../../utils/embeds');
const db = require('../../utils/database');
const { endGiveaway } = require('../../features/giveaways/manager');

const TABLE = 'giveaways.json';

function enterRow(entryCount) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('giveaway_enter')
      .setLabel(`Enter Giveaway (${entryCount})`)
      .setEmoji('🎉')
      .setStyle(ButtonStyle.Success)
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Manage giveaways.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName('start')
        .setDescription('Start a new giveaway.')
        .addStringOption((opt) => opt.setName('prize').setDescription('What are you giving away?').setRequired(true))
        .addIntegerOption((opt) =>
          opt.setName('duration_minutes').setDescription('Duration in minutes').setRequired(true).setMinValue(1)
        )
        .addIntegerOption((opt) => opt.setName('winners').setDescription('Number of winners').setMinValue(1))
    )
    .addSubcommand((sub) =>
      sub
        .setName('end')
        .setDescription('End a giveaway early.')
        .addStringOption((opt) => opt.setName('message_id').setDescription('The giveaway message ID').setRequired(true))
    ),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'start') {
      const prize = interaction.options.getString('prize');
      const durationMinutes = interaction.options.getInteger('duration_minutes');
      const winnerCount = interaction.options.getInteger('winners') || 1;
      const endsAt = Date.now() + durationMinutes * 60_000;

      const embed = baseEmbed()
        .setTitle('🎉 Giveaway!')
        .setDescription(`**Prize:** ${prize}\n**Winners:** ${winnerCount}\n**Ends:** <t:${Math.floor(endsAt / 1000)}:R>`)
        .setFooter({ text: `Hosted by ${interaction.user.tag}` });

      const message = await interaction.channel.send({ embeds: [embed], components: [enterRow(0)] });

      const all = db.getRaw(TABLE);
      all[message.id] = {
        guildId: interaction.guild.id,
        channelId: interaction.channel.id,
        prize,
        winnerCount,
        endsAt,
        hostId: interaction.user.id,
        entrants: [],
        ended: false,
      };
      db.setRaw(TABLE, all);

      return interaction.reply({ embeds: [successEmbed('Giveaway started!')], ephemeral: true });
    }

    if (sub === 'end') {
      const messageId = interaction.options.getString('message_id');
      const all = db.getRaw(TABLE);
      const giveaway = all[messageId];

      if (!giveaway || giveaway.ended) {
        return interaction.reply({ embeds: [errorEmbed('No active giveaway found with that message ID.')], ephemeral: true });
      }

      await endGiveaway(client, messageId);
      return interaction.reply({ embeds: [successEmbed('Giveaway ended.')], ephemeral: true });
    }
  },
};
