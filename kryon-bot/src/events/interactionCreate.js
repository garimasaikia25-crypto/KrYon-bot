/**
 * interactionCreate.js
 * ---------------------
 * The central router for all interactions:
 *   - Slash commands  (ChatInputCommand)
 *   - Buttons          (ticket create/claim/close/delete, giveaway enter, etc.)
 *   - Select menus     (reaction roles)
 *   - Modals            (ticket close reason, suggestion/report forms, /embed builder)
 *
 * Cross-cutting concerns handled here for every slash command:
 *   - Cooldown checks
 *   - Anti-spam checks
 *   - Centralized error handling (so individual commands don't need
 *     duplicate try/catch boilerplate)
 *
 * Button/select/modal interactions with custom IDs are dispatched to their
 * owning feature module (ticket system, reaction roles, giveaways, etc.)
 * to keep this file from becoming a giant switch statement of unrelated logic.
 */

const { errorEmbed } = require('../utils/embeds');
const { checkCooldown, checkSpam } = require('../utils/cooldown');

// Feature-specific interaction handlers (buttons/modals not tied to a single slash command)
const ticketInteractions = require('../features/ticket/interactions');
const reactionRoleInteractions = require('../features/reactionRoles/interactions');
const giveawayInteractions = require('../features/giveaways/interactions');
const verificationInteractions = require('../features/verification/interactions');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    try {
      /* ---------------------------------------------------------- */
      /* Slash Commands                                              */
      /* ---------------------------------------------------------- */
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        // Anti-spam check
        if (checkSpam(interaction.user.id)) {
          return interaction.reply({
            embeds: [errorEmbed("You're sending commands too quickly. Please slow down.", 'Slow Down')],
            ephemeral: true,
          });
        }

        // Per-command cooldown
        const remaining = checkCooldown(interaction.user.id, interaction.commandName);
        if (remaining > 0) {
          return interaction.reply({
            embeds: [errorEmbed(`Please wait **${remaining}s** before using this command again.`, 'On Cooldown')],
            ephemeral: true,
          });
        }

        await command.execute(interaction, client);
        return;
      }

      /* ---------------------------------------------------------- */
      /* Autocomplete                                                */
      /* ---------------------------------------------------------- */
      if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);
        if (command?.autocomplete) await command.autocomplete(interaction, client);
        return;
      }

      /* ---------------------------------------------------------- */
      /* Buttons                                                     */
      /* ---------------------------------------------------------- */
      if (interaction.isButton()) {
        const id = interaction.customId;

        if (id.startsWith('ticket_')) return ticketInteractions.handleButton(interaction, client);
        if (id.startsWith('giveaway_')) return giveawayInteractions.handleButton(interaction, client);
        if (id.startsWith('verify_')) return verificationInteractions.handleButton(interaction, client);

        return;
      }

      /* ---------------------------------------------------------- */
      /* Select Menus                                                */
      /* ---------------------------------------------------------- */
      if (interaction.isStringSelectMenu()) {
        const id = interaction.customId;
        if (id.startsWith('reactionrole_')) return reactionRoleInteractions.handleSelect(interaction, client);
        return;
      }

      /* ---------------------------------------------------------- */
      /* Modals                                                      */
      /* ---------------------------------------------------------- */
      if (interaction.isModalSubmit()) {
        const id = interaction.customId;
        if (id.startsWith('ticket_')) return ticketInteractions.handleModal(interaction, client);
        return;
      }
    } catch (err) {
      console.error('[interactionCreate] Error handling interaction:', err);

      const payload = {
        embeds: [errorEmbed('Something went wrong while processing that. The error has been logged.')],
        ephemeral: true,
      };

      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(payload);
        } else if (interaction.isRepliable?.()) {
          await interaction.reply(payload);
        }
      } catch (followUpErr) {
        console.error('[interactionCreate] Failed to send error response:', followUpErr);
      }
    }
  },
};
