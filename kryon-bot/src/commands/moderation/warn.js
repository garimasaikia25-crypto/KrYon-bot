/**
 * warn.js
 * -------
 * Issues a warning to a member, persisted via the database utility so it
 * can be reviewed later with /warnings.
 */

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../../config/config.json');
const { successEmbed, errorEmbed, baseEmbed } = require('../../utils/embeds');
const { sendLog } = require('../../utils/logger');
const { canModerate } = require('../../utils/permissions');
const db = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Issue a warning to a member.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((opt) => opt.setName('user').setDescription('The member to warn').setRequired(true))
    .addStringOption((opt) => opt.setName('reason').setDescription('Reason for the warning').setRequired(true)),

  async execute(interaction, client) {
    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');
    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!targetMember) {
      return interaction.reply({ embeds: [errorEmbed('That user is not a member of this server.')], ephemeral: true });
    }

    const check = canModerate(interaction.member, targetMember, interaction.guild);
    if (!check.ok) {
      return interaction.reply({ embeds: [errorEmbed(check.reason)], ephemeral: true });
    }

    const warning = db.addWarning(interaction.guild.id, targetUser.id, interaction.user.id, reason);

    await targetUser
      .send({
        embeds: [
          baseEmbed()
            .setTitle(`You were warned in ${interaction.guild.name}`)
            .addFields({ name: 'Reason', value: reason }),
        ],
      })
      .catch(() => null);

    await interaction.reply({
      embeds: [successEmbed(`**${targetUser.tag}** has been warned (warning #${warning.id}).\n**Reason:** ${reason}`, 'Member Warned')],
    });

    sendLog(
      client,
      config.moderation.logChannelId,
      baseEmbed()
        .setTitle('⚠️ Warning Issued')
        .addFields(
          { name: 'User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
          { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
          { name: 'Warning #', value: `${warning.id}`, inline: true },
          { name: 'Reason', value: reason }
        )
    );
  },
};
