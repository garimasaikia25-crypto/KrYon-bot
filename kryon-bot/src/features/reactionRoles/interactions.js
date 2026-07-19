/**
 * interactions.js (reaction roles)
 * ---------------------------------
 * Handles selections made in a reaction-role select menu: adds roles the
 * member newly selected and removes roles they deselected, based on the
 * diff between the menu's full option set and the member's chosen values.
 */

const { errorEmbed, successEmbed } = require('../../utils/embeds');
const db = require('../../utils/database');

const TABLE = 'reactionroles.json';

async function handleSelect(interaction) {
  const allPanels = db.getRaw(TABLE);
  const panel = allPanels[interaction.guild.id]?.[interaction.channel.id];

  if (!panel) {
    return interaction.reply({ embeds: [errorEmbed('This reaction-role panel is no longer configured.')], ephemeral: true });
  }

  const selectedRoleIds = interaction.values; // roles the member wants active
  const allPanelRoleIds = panel.options.map((o) => o.roleId);
  const member = interaction.member;

  const toAdd = selectedRoleIds.filter((id) => !member.roles.cache.has(id));
  const toRemove = allPanelRoleIds.filter((id) => !selectedRoleIds.includes(id) && member.roles.cache.has(id));

  try {
    if (toAdd.length) await member.roles.add(toAdd);
    if (toRemove.length) await member.roles.remove(toRemove);
  } catch (err) {
    console.error('[reactionRoles] Failed to update member roles:', err);
    return interaction.reply({ embeds: [errorEmbed('Failed to update your roles. Check that my role is above the reaction roles.')], ephemeral: true });
  }

  const summary = [];
  if (toAdd.length) summary.push(`Added: ${toAdd.map((id) => `<@&${id}>`).join(', ')}`);
  if (toRemove.length) summary.push(`Removed: ${toRemove.map((id) => `<@&${id}>`).join(', ')}`);

  await interaction.reply({
    embeds: [successEmbed(summary.length ? summary.join('\n') : 'No changes made.', 'Roles Updated')],
    ephemeral: true,
  });
}

module.exports = { handleSelect };
