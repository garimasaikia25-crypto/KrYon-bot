/**
 * ticket.js
 * ---------
 * /ticket setup
 * Posts the ticket panel embed with a "Create Ticket" button in the
 * current channel. Staff-only (ManageGuild) to prevent random members
 * from spamming panels.
 *
 * The actual ticket creation/claim/close/delete logic lives in
 * ticketInteractions.js since it's triggered by button clicks, not a
 * slash command directly.
 */

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { baseEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Manage the ticket system.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub.setName('setup').setDescription('Post the ticket creation panel in this channel.')
    ),

  async execute(interaction) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({
        embeds: [errorEmbed('You need the **Manage Server** permission to do this.')],
        ephemeral: true,
      });
    }

    const embed = baseEmbed()
      .setTitle('🎟 Support Tickets')
      .setDescription(
        'Need help? Click the button below to open a private ticket with our staff team.\n\n' +
          'Please only open a ticket for genuine questions or issues — abusing the system may result in a warning.'
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_create')
        .setLabel('Create Ticket')
        .setEmoji('🎟')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({
      embeds: [baseEmbed().setDescription('✅ Ticket panel posted.')],
      ephemeral: true,
    });
  },
};
