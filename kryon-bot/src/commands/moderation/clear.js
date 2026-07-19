/**
 * clear.js
 * --------
 * Bulk-deletes a number of recent messages in the current channel.
 * Discord only allows bulk-deleting messages younger than 14 days;
 * older messages are skipped automatically by bulkDelete's filter option.
 */

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../../config/config.json');
const { successEmbed, errorEmbed, baseEmbed } = require('../../utils/embeds');
const { sendLog } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Bulk delete recent messages in this channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((opt) =>
      opt.setName('amount').setDescription('Number of messages to delete (1-100)').setRequired(true).setMinValue(1).setMaxValue(100)
    )
    .addUserOption((opt) => opt.setName('user').setDescription('Only delete messages from this user')),

  async execute(interaction, client) {
    const amount = interaction.options.getInteger('amount');
    const targetUser = interaction.options.getUser('user');

    await interaction.deferReply({ ephemeral: true });

    try {
      const messages = await interaction.channel.messages.fetch({ limit: 100 });
      const filtered = targetUser
        ? messages.filter((m) => m.author.id === targetUser.id).first(amount)
        : messages.first(amount);

      const deleted = await interaction.channel.bulkDelete(filtered, true);

      await interaction.editReply({ embeds: [successEmbed(`Deleted **${deleted.size}** message(s).`)] });

      sendLog(
        client,
        config.moderation.logChannelId,
        baseEmbed()
          .setTitle('🧹 Messages Cleared')
          .addFields(
            { name: 'Channel', value: `${interaction.channel}`, inline: true },
            { name: 'Amount', value: `${deleted.size}`, inline: true },
            { name: 'Moderator', value: `${interaction.user.tag}`, inline: true }
          )
      );
    } catch (err) {
      console.error('[clear] Failed to bulk delete:', err);
      await interaction.editReply({
        embeds: [errorEmbed('Failed to delete messages. Messages older than 14 days cannot be bulk-deleted.')],
      });
    }
  },
};
