/**
 * cooldown.js
 * -----------
 * In-memory cooldown tracker used to:
 *   1. Rate-limit individual slash commands (per user, per command).
 *   2. Provide basic anti-command-spam protection (too many commands in a
 *      short window => temporary lockout).
 *
 * Since this is in-memory, cooldowns reset on bot restart. That's an
 * acceptable tradeoff for this use case; swap in Redis/DB if you need
 * persistence across restarts.
 */

const config = require('../../config/config.json');

// Map<"userId-commandName", timestampWhenAvailableAgain>
const cooldowns = new Map();

// Anti-spam: Map<userId, {count, windowStart}>
const spamTracker = new Map();
const SPAM_WINDOW_MS = 10_000; // 10 seconds
const SPAM_MAX_COMMANDS = 6; // more than 6 commands in 10s => flagged as spam
const SPAM_LOCKOUT_MS = 15_000; // 15 second lockout once flagged

/**
 * Checks (and updates) the per-command cooldown for a user.
 * Returns 0 if allowed to proceed, or the number of seconds remaining.
 */
function checkCooldown(userId, commandName, seconds = config.cooldownSeconds) {
  const key = `${userId}-${commandName}`;
  const now = Date.now();
  const expiresAt = cooldowns.get(key);

  if (expiresAt && now < expiresAt) {
    return Math.ceil((expiresAt - now) / 1000);
  }

  cooldowns.set(key, now + seconds * 1000);
  return 0;
}

/**
 * Tracks command usage for anti-spam purposes.
 * Returns true if the user should be blocked for spamming.
 */
function checkSpam(userId) {
  const now = Date.now();
  const entry = spamTracker.get(userId);

  if (!entry) {
    spamTracker.set(userId, { count: 1, windowStart: now, lockedUntil: 0 });
    return false;
  }

  if (entry.lockedUntil && now < entry.lockedUntil) {
    return true; // still locked out
  }

  if (now - entry.windowStart > SPAM_WINDOW_MS) {
    // window expired, reset
    entry.count = 1;
    entry.windowStart = now;
    entry.lockedUntil = 0;
    return false;
  }

  entry.count += 1;
  if (entry.count > SPAM_MAX_COMMANDS) {
    entry.lockedUntil = now + SPAM_LOCKOUT_MS;
    return true;
  }

  return false;
}

module.exports = { checkCooldown, checkSpam };
