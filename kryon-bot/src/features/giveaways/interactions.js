/**
 * interactions.js (giveaways)
 * -----------------------------
 * Handles the "Enter Giveaway" button: toggles the clicking member's
 * entry and updates the button's entry-count label.
 */

const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { errorEmbed, successEmbed } = require('../../utils/embeds');
const db = require('../../utils/database');

const TABLE = 'giveaways.json';

function enterRow(entryCount) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('giveaway_enter')
      .setLabel(`Enter Giveaway (${entryCount})`)
      .setEmoji('🎉')
      .setStyle(ButtonStyle.Success)
  );
}

async function handleButton(interaction) {
  if (interaction.customId !== 'giveaway_enter') return;

  const all = db.getRaw(TABLE);
  const giveaway = all[interaction.message.id];

  if (!giveaway || giveaway.ended) {
    return interaction.reply({ embeds: [errorEmbed('This giveaway has already ended.')], ephemeral: true });
  }

  const alreadyEntered = giveaway.entrants.includes(interaction.user.id);
  if (alreadyEntered) {
    giveaway.entrants = giveaway.entrants.filter((id) => id !== interaction.user.id);
  } else {
    giveaway.entrants.push(interaction.user.id);
  }

  db.setRaw(TABLE, all);

  await interaction.update({ components: [enterRow(giveaway.entrants.length)] });
  await interaction.followUp({
    embeds: [successEmbed(alreadyEntered ? 'You left the giveaway.' : "You're entered! Good luck!")],
    ephemeral: true,
  });
}

module.exports = { handleButton };
