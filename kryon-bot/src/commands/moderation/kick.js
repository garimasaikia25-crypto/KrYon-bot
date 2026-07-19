/**
 * kick.js
 * -------
 * Kicks a member from the server, with permission/hierarchy checks,
 * a best-effort DM notification, and mod-log logging.
 */

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../../config/config.json');
const { successEmbed, errorEmbed, baseEmbed } = require('../../utils/embeds');
const { sendLog } = require('../../utils/logger');
const { canModerate } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((opt) => opt.setName('user').setDescription('The member to kick').setRequired(true))
    .addStringOption((opt) => opt.setName('reason').setDescription('Reason for the kick')),

  async execute(interaction, client) {
    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!targetMember) {
      return interaction.reply({ embeds: [errorEmbed('That user is not a member of this server.')], ephemeral: true });
    }

    const check = canModerate(interaction.member, targetMember, interaction.guild);
    if (!check.ok) {
      return interaction.reply({ embeds: [errorEmbed(check.reason)], ephemeral: true });
    }

    await targetUser
      .send({
        embeds: [
          baseEmbed()
            .setTitle(`You were kicked from ${interaction.guild.name}`)
            .addFields({ name: 'Reason', value: reason }),
        ],
      })
      .catch(() => null);

    try {
      await targetMember.kick(`${interaction.user.tag}: ${reason}`);
    } catch (err) {
      console.error('[kick] Failed to kick member:', err);
      return interaction.reply({ embeds: [errorEmbed('Failed to kick that user. Check my permissions/role position.')], ephemeral: true });
    }

    await interaction.reply({ embeds: [successEmbed(`**${targetUser.tag}** was kicked.\n**Reason:** ${reason}`, 'Member Kicked')] });

    sendLog(
      client,
      config.moderation.logChannelId,
      baseEmbed()
        .setTitle('👢 Kick Issued')
        .addFields(
          { name: 'User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
          { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
          { name: 'Reason', value: reason }
        )
    );
  },
};
