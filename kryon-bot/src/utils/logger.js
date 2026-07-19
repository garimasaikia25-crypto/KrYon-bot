/**
 * logger.js
 * ---------
 * Sends formatted embeds to log channels configured in config.json.
 * Also logs to the console so nothing is lost if a channel ID is missing
 * or misconfigured.
 */

const { baseEmbed } = require('./embeds');

/**
 * Sends an embed to a channel by ID, silently no-oping (with a console
 * warning) if the channel can't be found/isn't configured. This keeps
 * logging failures from ever crashing a command or event handler.
 */
async function sendLog(client, channelId, embed) {
  if (!channelId || channelId.startsWith('PUT_')) return; // not configured
  try {
    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel || !channel.isTextBased()) {
      console.warn(`[logger] Log channel ${channelId} not found or not text-based.`);
      return;
    }
    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error('[logger] Failed to send log message:', err);
  }
}

/** Generic helper for building a quick log embed. */
function logEmbed(title, description, color) {
  const embed = baseEmbed().setTitle(title).setDescription(description);
  if (color) embed.setColor(color);
  return embed;
}

module.exports = { sendLog, logEmbed };
