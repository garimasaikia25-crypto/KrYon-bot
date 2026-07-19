/**
 * untimeout.js
 * ------------
 * Removes an active timeout from a member.
 */

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../../config/config.json');
const { successEmbed, errorEmbed, baseEmbed } = require('../../utils/embeds');
const { sendLog } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription("Remove a member's timeout.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((opt) => opt.setName('user').setDescription('The member to un-timeout').setRequired(true))
    .addStringOption((opt) => opt.setName('reason').setDescription('Reason for removing the timeout')),

  async execute(interaction, client) {
    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!targetMember) {
      return interaction.reply({ embeds: [errorEmbed('That user is not a member of this server.')], ephemeral: true });
    }

    if (!targetMember.communicationDisabledUntilTimestamp) {
      return interaction.reply({ embeds: [errorEmbed('That member is not currently timed out.')], ephemeral: true });
    }

    try {
      await targetMember.timeout(null, `${interaction.user.tag}: ${reason}`);
    } catch (err) {
      console.error('[untimeout] Failed to remove timeout:', err);
      return interaction.reply({ embeds: [errorEmbed('Failed to remove the timeout. Check my permissions/role position.')], ephemeral: true });
    }

    await interaction.reply({ embeds: [successEmbed(`**${targetUser.tag}**'s timeout was removed.`, 'Timeout Removed')] });

    sendLog(
      client,
      config.moderation.logChannelId,
      baseEmbed()
        .setTitle('🔊 Timeout Removed')
        .addFields(
          { name: 'User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
          { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
          { name: 'Reason', value: reason }
        )
    );
  },
};
