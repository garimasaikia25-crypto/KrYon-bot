/**
 * permissions.js
 * --------------
 * Shared helpers for checking member permissions and role hierarchy before
 * allowing a moderation action to proceed.
 */

const { PermissionsBitField } = require('discord.js');
const config = require('../../config/config.json');

/** Does the member have the given permission (or Administrator)? */
function hasPermission(member, permissionFlag) {
  return (
    member.permissions.has(PermissionsBitField.Flags.Administrator) ||
    member.permissions.has(permissionFlag)
  );
}

/** Is this member's highest role above the target's highest role? */
function isHigherRole(member, target) {
  return member.roles.highest.position > target.roles.highest.position;
}

/**
 * Validates that `executor` is allowed to take a moderation action against
 * `target`. Returns { ok: true } or { ok: false, reason: string }.
 */
function canModerate(executor, target, guild) {
  if (target.id === executor.id) {
    return { ok: false, reason: 'You cannot use this action on yourself.' };
  }
  if (target.id === guild.ownerId) {
    return { ok: false, reason: 'You cannot moderate the server owner.' };
  }
  if (!isHigherRole(executor, target)) {
    return {
      ok: false,
      reason: 'You cannot moderate someone with an equal or higher role than you.',
    };
  }
  if (!target.moderatable) {
    return {
      ok: false,
      reason: "I don't have permission to moderate this member (check my role position).",
    };
  }
  return { ok: true };
}

/** Checks if a member has the configured staff role (used for tickets). */
function isStaff(member) {
  const staffRoleId = config.tickets.staffRoleId;
  if (!staffRoleId || staffRoleId.startsWith('PUT_')) return false;
  return member.roles.cache.has(staffRoleId);
}

module.exports = { hasPermission, isHigherRole, canModerate, isStaff };
