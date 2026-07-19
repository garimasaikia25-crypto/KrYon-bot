/**
 * help.js
 * -------
 * Lists all available slash commands, grouped by category (derived
 * automatically from the folder each command lives in — see
 * commandHandler.js).
 */

const { SlashCommandBuilder } = require('discord.js');
const { baseEmbed } = require('../../utils/embeds');
const config = require('../../../config/config.json');

const CATEGORY_LABELS = {
  moderation: '🛡 Moderation',
  server: '📊 Server',
  minecraft: '🌐 Minecraft',
  ticket: '🎟 Tickets',
  utility: '⚙ Utility',
  reactionroles: '🎭 Reaction Roles',
  giveaway: '🎉 Giveaways',
  verification: '✅ Verification',
  leveling: '📈 Leveling',
};

module.exports = {
  data: new SlashCommandBuilder().setName('help').setDescription('List all available commands.'),

  async execute(interaction, client) {
    const grouped = {};

    for (const command of client.commands.values()) {
      const label = CATEGORY_LABELS[command.category] || command.category;
      grouped[label] = grouped[label] || [];
      grouped[label].push(`\`/${command.data.name}\` — ${command.data.description}`);
    }

    const embed = baseEmbed()
      .setTitle(`${config.botName} — Command List`)
      .setDescription('Here are all the commands I support, grouped by category.');

    for (const [label, commands] of Object.entries(grouped)) {
      embed.addFields({ name: label, value: commands.join('\n') });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
