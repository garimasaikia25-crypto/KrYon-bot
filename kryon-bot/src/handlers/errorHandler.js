/**
 * errorHandler.js
 * ---------------
 * Registers process-level handlers so an unexpected error anywhere in the
 * bot logs clearly to the console instead of silently crashing the process
 * (or crashing it ungracefully). This is separate from the per-interaction
 * try/catch blocks used in interactionCreate.js, which handle command-level
 * errors and reply to the user.
 */

function registerErrorHandlers(client) {
  process.on('unhandledRejection', (reason) => {
    console.error('[errorHandler] Unhandled promise rejection:', reason);
  });

  process.on('uncaughtException', (err) => {
    console.error('[errorHandler] Uncaught exception:', err);
  });

  client.on('error', (err) => {
    console.error('[errorHandler] Discord client error:', err);
  });

  client.on('shardError', (err) => {
    console.error('[errorHandler] WebSocket connection error:', err);
  });

  client.on('warn', (info) => {
    console.warn('[errorHandler] Client warning:', info);
  });
}

module.exports = { registerErrorHandlers };
