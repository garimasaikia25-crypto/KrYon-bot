/**
 * embeds.js
 * ---------
 * Central place for building consistently-styled embeds so every command
 * doesn't need to repeat color/footer boilerplate.
 */

const { EmbedBuilder } = require('discord.js');
const config = require('../../config/config.json');

/** Base embed with KrYon branding (color + footer + timestamp). */
function baseEmbed() {
  return new EmbedBuilder()
    .setColor(config.embedColor)
    .setFooter({ text: config.botName })
    .setTimestamp();
}

function successEmbed(description, title = 'Success') {
  return baseEmbed()
    .setColor(config.successColor)
    .setTitle(`✅ ${title}`)
    .setDescription(description);
}

function errorEmbed(description, title = 'Error') {
  return baseEmbed()
    .setColor(config.errorColor)
    .setTitle(`❌ ${title}`)
    .setDescription(description);
}

function warnEmbed(description, title = 'Warning') {
  return baseEmbed()
    .setColor(config.warnColor)
    .setTitle(`⚠️ ${title}`)
    .setDescription(description);
}

module.exports = { baseEmbed, successEmbed, errorEmbed, warnEmbed };
