/**
 * transcript.js
 * -------------
 * Generates a simple HTML transcript of a ticket channel's message history
 * before the channel is deleted, so staff retain a record of the conversation.
 */

const fs = require('fs');
const path = require('path');
const { AttachmentBuilder } = require('discord.js');

const TRANSCRIPT_DIR = path.join(__dirname, '..', '..', 'data', 'transcripts');

if (!fs.existsSync(TRANSCRIPT_DIR)) {
  fs.mkdirSync(TRANSCRIPT_DIR, { recursive: true });
}

/** Escapes HTML-special characters so message content renders safely. */
function escapeHtml(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Fetches all messages in a channel (up to Discord's practical limits) and
 * builds an HTML transcript file. Returns a discord.js AttachmentBuilder
 * ready to be sent to a log channel.
 */
async function generateTranscript(channel) {
  let allMessages = [];
  let lastId;

  // Paginate backwards through message history, 100 at a time.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const options = { limit: 100 };
    if (lastId) options.before = lastId;

    const batch = await channel.messages.fetch(options);
    if (batch.size === 0) break;

    allMessages = allMessages.concat(Array.from(batch.values()));
    lastId = batch.last().id;

    if (batch.size < 100) break;
  }

  // Oldest first
  allMessages.reverse();

  const rows = allMessages
    .map((m) => {
      const time = new Date(m.createdTimestamp).toLocaleString();
      const author = escapeHtml(m.author?.tag ?? 'Unknown');
      const content = escapeHtml(m.content || '(no text content)');
      const attachments = m.attachments
        .map((a) => `<div class="attachment">📎 <a href="${a.url}">${escapeHtml(a.name)}</a></div>`)
        .join('');
      return `
        <div class="message">
          <span class="author">${author}</span>
          <span class="timestamp">${time}</span>
          <div class="content">${content}</div>
          ${attachments}
        </div>`;
    })
    .join('\n');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Transcript - ${escapeHtml(channel.name)}</title>
  <style>
    body { background:#313338; color:#dbdee1; font-family: sans-serif; padding: 20px; }
    .message { border-bottom: 1px solid #3f4147; padding: 8px 0; }
    .author { font-weight: bold; color: #f2f3f5; margin-right: 8px; }
    .timestamp { font-size: 12px; color: #949ba4; }
    .content { margin-top: 4px; white-space: pre-wrap; }
    .attachment { margin-top: 4px; font-size: 13px; }
    a { color: #00a8fc; }
  </style>
</head>
<body>
  <h2>Transcript for #${escapeHtml(channel.name)}</h2>
  <p>Generated ${new Date().toLocaleString()}</p>
  ${rows || '<p>No messages found.</p>'}
</body>
</html>`;

  const filePath = path.join(TRANSCRIPT_DIR, `${channel.id}.html`);
  fs.writeFileSync(filePath, html);

  return new AttachmentBuilder(filePath, { name: `transcript-${channel.name}.html` });
}

module.exports = { generateTranscript };
