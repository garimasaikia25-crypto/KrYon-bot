/**
 * manager.js (giveaways)
 * ------------------------
 * Two responsibilities:
 *   1. startGiveawayScheduler(client) — polls giveaways.json every 30s and
 *      auto-ends any giveaway whose endsAt has passed. Call this once from
 *      index.js after login.
 *   2. endGiveaway(client, messageId) — shared logic for both the scheduler
 *      and the manual `/giveaway end` command: picks random winners from
 *      the entrant list, edits the original message, and announces winners.
 */

const { baseEmbed } = require('../../utils/embeds');
const db = require('../../utils/database');

const TABLE = 'giveaways.json';
const POLL_INTERVAL_MS = 30_000;

function pickWinners(entrants, count) {
  const pool = [...entrants];
  const winners = [];
  while (pool.length > 0 && winners.length < count) {
    const index = Math.floor(Math.random() * pool.length);
    winners.push(pool.splice(index, 1)[0]);
  }
  return winners;
}

async function endGiveaway(client, messageId) {
  const all = db.getRaw(TABLE);
  const giveaway = all[messageId];
  if (!giveaway || giveaway.ended) return;

  giveaway.ended = true;
  db.setRaw(TABLE, all);

  const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
  if (!channel) return;

  const winners = pickWinners(giveaway.entrants, giveaway.winnerCount);

  const resultEmbed = baseEmbed()
    .setTitle('🎉 Giveaway Ended')
    .setDescription(
      winners.length > 0
        ? `**Prize:** ${giveaway.prize}\n**Winner(s):** ${winners.map((id) => `<@${id}>`).join(', ')}`
        : `**Prize:** ${giveaway.prize}\nNo valid entries — no winner could be selected.`
    );

  const message = await channel.messages.fetch(messageId).catch(() => null);
  if (message) {
    await message.edit({ embeds: [resultEmbed], components: [] }).catch(() => null);
  }

  await channel.send({
    content: winners.length > 0 ? winners.map((id) => `<@${id}>`).join(', ') : undefined,
    embeds: [
      baseEmbed()
        .setTitle('🏆 Winner Announcement')
        .setDescription(
          winners.length > 0
            ? `Congratulations! You won **${giveaway.prize}**!`
            : `No one entered the giveaway for **${giveaway.prize}**.`
        ),
    ],
  });
}

function startGiveawayScheduler(client) {
  setInterval(async () => {
    const all = db.getRaw(TABLE);
    const now = Date.now();

    for (const [messageId, giveaway] of Object.entries(all)) {
      if (!giveaway.ended && giveaway.endsAt <= now) {
        await endGiveaway(client, messageId);
      }
    }
  }, POLL_INTERVAL_MS);

  console.log('[giveawayManager] Scheduler started.');
}

module.exports = { endGiveaway, startGiveawayScheduler };
