/**
 * ticketInteractions.js
 * ----------------------
 * Handles every button interaction related to the ticket system:
 *   - ticket_create : opens a new private ticket channel
 *   - ticket_claim   : a staff member claims responsibility for the ticket
 *   - ticket_close    : locks the channel from further messages by the creator
 *   - ticket_delete    : generates a transcript, logs it, then deletes the channel
 *
 * Ticket state (creator, claimedBy, status) is persisted via utils/database.js
 * so it survives bot restarts.
 */

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ChannelType,
} = require('discord.js');
const config = require('../../../config/config.json');
const { baseEmbed, successEmbed, errorEmbed } = require('../../utils/embeds');
const { sendLog } = require('../../utils/logger');
const { generateTranscript } = require('../../utils/transcript');
const { isStaff } = require('../../utils/permissions');
const db = require('../../utils/database');

/** Builds the button row shown inside an open ticket channel. */
function openTicketRow(claimed) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_claim')
      .setLabel(claimed ? 'Claimed' : 'Claim')
      .setEmoji('🙋')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(claimed),
    new ButtonBuilder()
      .setCustomId('ticket_close')
      .setLabel('Close Ticket')
      .setEmoji('🔒')
      .setStyle(ButtonStyle.Danger)
  );
}

/** Buttons shown after a ticket has been closed (pending deletion). */
function closedTicketRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_delete')
      .setLabel('Delete Ticket')
      .setEmoji('🗑')
      .setStyle(ButtonStyle.Danger)
  );
}

async function createTicket(interaction, client) {
  const { guild, user, member } = interaction;

  if (db.hasOpenTicket(guild.id, user.id)) {
    return interaction.reply({
      embeds: [errorEmbed('You already have an open ticket.')],
      ephemeral: true,
    });
  }

  await interaction.deferReply({ ephemeral: true });

  const categoryId = config.tickets.categoryId;
  const staffRoleId = config.tickets.staffRoleId;

  const overwrites = [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    {
      id: user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    },
    { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
  ];

  if (staffRoleId && !staffRoleId.startsWith('PUT_') && guild.roles.cache.has(staffRoleId)) {
    overwrites.push({
      id: staffRoleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    });
  }

  const channelOptions = {
    name: `${config.tickets.ticketNamePrefix}-${user.username}`.toLowerCase().slice(0, 90),
    type: ChannelType.GuildText,
    permissionOverwrites: overwrites,
    topic: `Ticket owner: ${user.id}`,
  };

  if (categoryId && !categoryId.startsWith('PUT_') && guild.channels.cache.has(categoryId)) {
    channelOptions.parent = categoryId;
  }

  let channel;
  try {
    channel = await guild.channels.create(channelOptions);
  } catch (err) {
    console.error('[ticketInteractions] Failed to create ticket channel:', err);
    return interaction.editReply({
      embeds: [errorEmbed('Failed to create your ticket channel. Please contact staff directly.')],
    });
  }

  db.createTicket(guild.id, channel.id, { creatorId: user.id });

  const embed = baseEmbed()
    .setTitle('🎟 New Ticket')
    .setDescription(
      `Hello ${member}, thanks for reaching out!\nPlease describe your issue and a staff member will be with you shortly.`
    )
    .addFields({ name: 'Opened By', value: `${user.tag}`, inline: true });

  await channel.send({ content: `${member}`, embeds: [embed], components: [openTicketRow(false)] });

  sendLog(
    client,
    config.tickets.logChannelId,
    baseEmbed()
      .setTitle('🎟 Ticket Created')
      .setDescription(`${channel} opened by ${user} (\`${user.tag}\`)`)
  );

  await interaction.editReply({
    embeds: [successEmbed(`Your ticket has been created: ${channel}`)],
  });
}

async function claimTicket(interaction, client) {
  const ticket = db.getTicket(interaction.guild.id, interaction.channel.id);
  if (!ticket) {
    return interaction.reply({ embeds: [errorEmbed('This channel is not an active ticket.')], ephemeral: true });
  }
  if (!isStaff(interaction.member) && !interaction.memberPermissions.has(PermissionFlagsBits.ManageChannels)) {
    return interaction.reply({ embeds: [errorEmbed('Only staff can claim tickets.')], ephemeral: true });
  }
  if (ticket.claimedBy) {
    return interaction.reply({ embeds: [errorEmbed('This ticket has already been claimed.')], ephemeral: true });
  }

  db.updateTicket(interaction.guild.id, interaction.channel.id, { claimedBy: interaction.user.id });

  await interaction.update({ components: [openTicketRow(true)] });
  await interaction.channel.send({
    embeds: [successEmbed(`🙋 This ticket has been claimed by ${interaction.user}.`)],
  });

  sendLog(
    client,
    config.tickets.logChannelId,
    baseEmbed()
      .setTitle('🙋 Ticket Claimed')
      .setDescription(`${interaction.channel} claimed by ${interaction.user}`)
  );
}

async function closeTicket(interaction, client) {
  const ticket = db.getTicket(interaction.guild.id, interaction.channel.id);
  if (!ticket) {
    return interaction.reply({ embeds: [errorEmbed('This channel is not an active ticket.')], ephemeral: true });
  }

  const isCreator = interaction.user.id === ticket.creatorId;
  if (!isCreator && !isStaff(interaction.member) && !interaction.memberPermissions.has(PermissionFlagsBits.ManageChannels)) {
    return interaction.reply({ embeds: [errorEmbed('Only the ticket creator or staff can close this ticket.')], ephemeral: true });
  }

  db.updateTicket(interaction.guild.id, interaction.channel.id, { status: 'closed' });

  // Remove the creator's ability to send messages, but leave read access
  // so they can see the closing message / eventual transcript notice.
  await interaction.channel.permissionOverwrites
    .edit(ticket.creatorId, { SendMessages: false })
    .catch(() => null);

  await interaction.reply({
    embeds: [
      baseEmbed()
        .setTitle('🔒 Ticket Closed')
        .setDescription(`Closed by ${interaction.user}. A staff member can delete this ticket when ready.`),
    ],
    components: [closedTicketRow()],
  });

  sendLog(
    client,
    config.tickets.logChannelId,
    baseEmbed()
      .setTitle('🔒 Ticket Closed')
      .setDescription(`${interaction.channel} closed by ${interaction.user}`)
  );
}

async function deleteTicket(interaction, client) {
  const ticket = db.getTicket(interaction.guild.id, interaction.channel.id);
  if (!ticket) {
    return interaction.reply({ embeds: [errorEmbed('This channel is not an active ticket.')], ephemeral: true });
  }
  if (!isStaff(interaction.member) && !interaction.memberPermissions.has(PermissionFlagsBits.ManageChannels)) {
    return interaction.reply({ embeds: [errorEmbed('Only staff can delete tickets.')], ephemeral: true });
  }

  await interaction.reply({ embeds: [baseEmbed().setDescription('🗑 Generating transcript and deleting ticket...')] });

  try {
    const transcript = await generateTranscript(interaction.channel);
    const transcriptChannelId = config.tickets.transcriptChannelId || config.tickets.logChannelId;
    const logChannel = await client.channels.fetch(transcriptChannelId).catch(() => null);

    if (logChannel) {
      await logChannel.send({
        embeds: [
          baseEmbed()
            .setTitle('🗑 Ticket Deleted')
            .setDescription(
              `**Channel:** #${interaction.channel.name}\n**Creator:** <@${ticket.creatorId}>\n**Deleted by:** ${interaction.user}`
            ),
        ],
        files: [transcript],
      });
    }
  } catch (err) {
    console.error('[ticketInteractions] Failed to generate/send transcript:', err);
  }

  db.deleteTicket(interaction.guild.id, interaction.channel.id);

  setTimeout(() => {
    interaction.channel.delete().catch((err) =>
      console.error('[ticketInteractions] Failed to delete ticket channel:', err)
    );
  }, 3000);
}

async function handleButton(interaction, client) {
  switch (interaction.customId) {
    case 'ticket_create':
      return createTicket(interaction, client);
    case 'ticket_claim':
      return claimTicket(interaction, client);
    case 'ticket_close':
      return closeTicket(interaction, client);
    case 'ticket_delete':
      return deleteTicket(interaction, client);
    default:
      return;
  }
}

// No modals are currently used by the ticket system, but the router in
// interactionCreate.js expects this export to exist for forward-compatibility.
async function handleModal() {
  return;
}

module.exports = { handleButton, handleModal };
