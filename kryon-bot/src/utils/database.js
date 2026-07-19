/**
 * database.js
 * -----------
 * A tiny, dependency-free JSON file "database".
 *
 * Why JSON instead of SQLite?
 * better-sqlite3 requires native compilation which can be a pain across
 * different hosting environments. This simple flat-file store covers the
 * needs of this bot (warnings, tickets, guild settings) and can be swapped
 * out for a real database later without touching command code, since all
 * reads/writes go through the methods below.
 *
 * Each "table" is its own JSON file inside /data.
 * Data shape:
 *   warnings.json => { "<guildId>": { "<userId>": [ {id, moderatorId, reason, timestamp} ] } }
 *   tickets.json   => { "<guildId>": { "<channelId>": {creatorId, claimedBy, status, createdAt} } }
 *   settings.json  => { "<guildId>": { key: value } }
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');

// Make sure the data directory exists before we try to read/write to it.
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Ensures a given JSON "table" file exists, creating it with a default
 * value ({}) if it doesn't.
 */
function ensureFile(fileName) {
  const filePath = path.join(DATA_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
  }
  return filePath;
}

/** Reads and parses a JSON table file, returning {} on any failure. */
function readTable(fileName) {
  try {
    const filePath = ensureFile(fileName);
    const raw = fs.readFileSync(filePath, 'utf8');
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error(`[database] Failed to read ${fileName}:`, err);
    return {};
  }
}

/** Writes a JS object back to a JSON table file, pretty-printed. */
function writeTable(fileName, data) {
  try {
    const filePath = ensureFile(fileName);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`[database] Failed to write ${fileName}:`, err);
  }
}

/* ------------------------------------------------------------------ */
/* Warnings                                                           */
/* ------------------------------------------------------------------ */

const WARNINGS_FILE = 'warnings.json';

function addWarning(guildId, userId, moderatorId, reason) {
  const db = readTable(WARNINGS_FILE);
  db[guildId] = db[guildId] || {};
  db[guildId][userId] = db[guildId][userId] || [];

  const warning = {
    id: db[guildId][userId].length + 1,
    moderatorId,
    reason,
    timestamp: Date.now(),
  };

  db[guildId][userId].push(warning);
  writeTable(WARNINGS_FILE, db);
  return warning;
}

function getWarnings(guildId, userId) {
  const db = readTable(WARNINGS_FILE);
  return (db[guildId] && db[guildId][userId]) || [];
}

function clearWarnings(guildId, userId) {
  const db = readTable(WARNINGS_FILE);
  if (db[guildId]) {
    delete db[guildId][userId];
    writeTable(WARNINGS_FILE, db);
  }
}

/* ------------------------------------------------------------------ */
/* Tickets                                                            */
/* ------------------------------------------------------------------ */

const TICKETS_FILE = 'tickets.json';

function createTicket(guildId, channelId, data) {
  const db = readTable(TICKETS_FILE);
  db[guildId] = db[guildId] || {};
  db[guildId][channelId] = {
    creatorId: data.creatorId,
    claimedBy: null,
    status: 'open',
    createdAt: Date.now(),
  };
  writeTable(TICKETS_FILE, db);
  return db[guildId][channelId];
}

function getTicket(guildId, channelId) {
  const db = readTable(TICKETS_FILE);
  return (db[guildId] && db[guildId][channelId]) || null;
}

function updateTicket(guildId, channelId, updates) {
  const db = readTable(TICKETS_FILE);
  if (db[guildId] && db[guildId][channelId]) {
    db[guildId][channelId] = { ...db[guildId][channelId], ...updates };
    writeTable(TICKETS_FILE, db);
    return db[guildId][channelId];
  }
  return null;
}

function deleteTicket(guildId, channelId) {
  const db = readTable(TICKETS_FILE);
  if (db[guildId]) {
    delete db[guildId][channelId];
    writeTable(TICKETS_FILE, db);
  }
}

/** Returns true if this user already has an open ticket in this guild. */
function hasOpenTicket(guildId, userId) {
  const db = readTable(TICKETS_FILE);
  const guildTickets = db[guildId] || {};
  return Object.values(guildTickets).some(
    (t) => t.creatorId === userId && t.status === 'open'
  );
}

/* ------------------------------------------------------------------ */
/* Guild Settings (e.g. rejoin tracking for "welcome back")           */
/* ------------------------------------------------------------------ */

const SETTINGS_FILE = 'settings.json';

function getGuildSetting(guildId, key, fallback = null) {
  const db = readTable(SETTINGS_FILE);
  if (db[guildId] && Object.prototype.hasOwnProperty.call(db[guildId], key)) {
    return db[guildId][key];
  }
  return fallback;
}

function setGuildSetting(guildId, key, value) {
  const db = readTable(SETTINGS_FILE);
  db[guildId] = db[guildId] || {};
  db[guildId][key] = value;
  writeTable(SETTINGS_FILE, db);
}

/** Tracks members who have joined before, per guild, to detect rejoins. */
function markMemberSeen(guildId, userId) {
  const db = readTable(SETTINGS_FILE);
  db[guildId] = db[guildId] || {};
  db[guildId].seenMembers = db[guildId].seenMembers || [];
  const alreadySeen = db[guildId].seenMembers.includes(userId);
  if (!alreadySeen) {
    db[guildId].seenMembers.push(userId);
    writeTable(SETTINGS_FILE, db);
  }
  return alreadySeen; // true => this is a rejoin
}

/* ------------------------------------------------------------------ */
/* Generic table access (used by reaction roles, giveaways, leveling, */
/* AutoMod, and any future feature that needs its own JSON "table")   */
/* ------------------------------------------------------------------ */

/** Reads a full JSON table by filename, e.g. db.getRaw('giveaways.json'). */
function getRaw(fileName) {
  return readTable(fileName);
}

/** Overwrites a full JSON table by filename. */
function setRaw(fileName, data) {
  writeTable(fileName, data);
}

module.exports = {
  getRaw,
  setRaw,
  addWarning,
  getWarnings,
  clearWarnings,
  createTicket,
  getTicket,
  updateTicket,
  deleteTicket,
  hasOpenTicket,
  getGuildSetting,
  setGuildSetting,
  markMemberSeen,
};
