/**
 * reactionrole.js
 * ----------------
 * /reactionrole add
 * Posts (or appends to) a reaction-role message in the current channel
 * using a select menu (rather than legacy emoji reactions, which are
 * harder to manage). Staff run this once per role they want to offer;
 * the panel embed + select menu options accumulate in storage so the
 * bot can rebuild the menu correctly after a restart.
 *
 * Selecting an option in the menu toggles that role for the member —
 * handled in features/reactionRoles/interactions.js.
 */

const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { baseEmbed, errorEmbed, successEmbed } = require('../../utils/embeds');
const db = require('../../utils/database');

const TABLE = 'reactionroles.json';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reactionrole')
    .setDescription('Manage self-assignable reaction roles.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription('Add a role to the reaction-role panel in this channel.')
        .addRoleOption((opt) => opt.setName('role').setDescription('The role to offer').setRequired(true))
        .addStringOption((opt) => opt.setName('label').setDescription('Label shown in the menu').setRequired(true))
        .addStringOption((opt) => opt.setName('emoji').setDescription('Emoji shown next to the label'))
    ),

  async execute(interaction) {
    const role = interaction.options.getRole('role');
    const label = interaction.options.getString('label');
    const emoji = interaction.options.getString('emoji');

    if (role.managed || role.id === interaction.guild.id) {
      return interaction.reply({ embeds: [errorEmbed('That role cannot be used for reaction roles.')], ephemeral: true });
    }

    const allPanels = db.getRaw(TABLE);
    const guildPanels = allPanels[interaction.guild.id] || {};
    const panel = guildPanels[interaction.channel.id] || { messageId: null, options: [] };

    panel.options.push({ roleId: role.id, label, emoji: emoji || undefined });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('reactionrole_select')
      .setPlaceholder('Select your roles')
      .setMinValues(0)
      .setMaxValues(panel.options.length)
      .addOptions(
        panel.options.map((o) => ({
          label: o.label,
          value: o.roleId,
          emoji: o.emoji,
        }))
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);
    const embed = baseEmbed()
      .setTitle('🎭 Reaction Roles')
      .setDescription('Select the roles you want from the menu below. Selecting again removes the role.');

    let message;
    if (panel.messageId) {
      const oldMessage = await interaction.channel.messages.fetch(panel.messageId).catch(() => null);
      if (oldMessage) {
        message = await oldMessage.edit({ embeds: [embed], components: [row] });
      }
    }
    if (!message) {
      message = await interaction.channel.send({ embeds: [embed], components: [row] });
    }

    panel.messageId = message.id;
    guildPanels[interaction.channel.id] = panel;
    allPanels[interaction.guild.id] = guildPanels;
    db.setRaw(TABLE, allPanels);

    await interaction.reply({ embeds: [successEmbed(`Added **${role.name}** to the reaction-role panel.`)], ephemeral: true });
  },
};
