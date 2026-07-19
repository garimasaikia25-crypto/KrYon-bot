/**
 * interactions.js (verification)
 * --------------------------------
 * Handles clicks on the "Verify" button: assigns the configured
 * verification role to the clicking member.
 */

const { successEmbed, errorEmbed } = require('../../utils/embeds');
const config = require('../../../config/config.json');

async function handleButton(interaction) {
  if (interaction.customId !== 'verify_button') return;

  const roleId = config.verification?.roleId;
  const role = interaction.guild.roles.cache.get(roleId);

  if (!role) {
    return interaction.reply({ embeds: [errorEmbed('The verification role is not configured correctly. Contact staff.')], ephemeral: true });
  }

  if (interaction.member.roles.cache.has(roleId)) {
    return interaction.reply({ embeds: [successEmbed('You are already verified!')], ephemeral: true });
  }

  try {
    await interaction.member.roles.add(role);
  } catch (err) {
    console.error('[verification] Failed to assign role:', err);
    return interaction.reply({ embeds: [errorEmbed('Failed to verify you. Please contact a staff member.')], ephemeral: true });
  }

  await interaction.reply({ embeds: [successEmbed('You have been verified! Welcome to the server.')], ephemeral: true });
}

module.exports = { handleButton };
