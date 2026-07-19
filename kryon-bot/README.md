# KrYon Discord Bot

A production-ready, modular Discord.js v14 bot with a welcome system,
ticket support, moderation, logging, leveling, reaction roles,
giveaways, verification, AutoMod, and general utility commands.

## Folder Structure

```
kryon-bot/
├── config/config.json          # non-secret settings (channel/role IDs, colors, feature toggles)
├── data/                        # JSON "database" files, created automatically at runtime
├── src/
│   ├── index.js                 # entry point
│   ├── deploy-commands.js       # registers slash commands with Discord
│   ├── handlers/                # command/event loaders + global error handling
│   ├── events/                  # discord.js event listeners (one concern per file)
│   ├── commands/                # slash commands, grouped by category folder
│   │   ├── moderation/
│   │   ├── server/
│   │   ├── minecraft/
│   │   ├── ticket/
│   │   ├── utility/
│   │   ├── reactionroles/
│   │   ├── giveaway/
│   │   ├── verification/
│   │   └── leveling/
│   ├── features/                # button/select/modal handlers + schedulers not tied
│   │                             # to a single slash command (tickets, giveaways, etc.)
│   └── utils/                   # database, embeds, logger, permissions, cooldowns, transcripts
```

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create your bot application**
   - Go to https://discord.com/developers/applications
   - Create a new application, add a Bot user
   - Under "Bot", enable these **Privileged Gateway Intents**:
     - Server Members Intent
     - Message Content Intent
   - Copy the bot token and application (client) ID

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Fill in `DISCORD_TOKEN`, `CLIENT_ID`, and (optionally, for instant
   command updates during development) `GUILD_ID`.

4. **Configure `config/config.json`**
   Replace every `PUT_..._HERE` placeholder with the real channel/role/category
   IDs from your server (enable Developer Mode in Discord to copy IDs).
   Key sections: `welcome`, `tickets`, `moderation`, `logging`, `minecraft`,
   `verification`, `automod`, `leveling`.

5. **Invite the bot to your server**
   Generate an invite URL in the Developer Portal (OAuth2 → URL Generator)
   with the `bot` and `applications.commands` scopes, and at minimum these
   permissions: Manage Roles, Manage Channels, Kick Members, Ban Members,
   Moderate Members, Manage Messages, Read/Send Messages, Embed Links,
   Attach Files, Read Message History.

6. **Register slash commands**
   ```bash
   npm run deploy
   ```

7. **Start the bot**
   ```bash
   npm start
   ```

## Feature Notes

- **Database:** Warnings, tickets, reaction-role panels, giveaways, and
  levels are stored as flat JSON files under `/data`, created
  automatically. This avoids native-module (SQLite) build issues while
  keeping all reads/writes centralized in `src/utils/database.js`, so it
  can be swapped for a real database later without touching command code.
- **Tickets:** Run `/ticket setup` in the channel where you want the
  ticket panel. Transcripts are generated as HTML and sent to
  `tickets.transcriptChannelId` before the channel is deleted.
- **Reaction Roles:** Run `/reactionrole add` once per role you want to
  offer in a channel; repeated uses in the same channel append to the same
  select-menu panel.
- **Giveaways:** `/giveaway start` posts an entry button; a background
  scheduler (`features/giveaways/manager.js`) ends giveaways automatically
  even if no one clicks anything further.
- **AutoMod:** Configure `automod` in config.json (invite links, mention
  spam, caps, banned words). This is a lightweight complement to — not a
  replacement for — Discord's native AutoMod, which can be configured
  separately in Server Settings for more advanced rules.
- **Example role hierarchy:** if you're setting up staff/member roles from
  scratch, a common structure (highest to lowest) is: Owner → Co-Owner →
  Manager → Administrator → Head Moderator → Moderator → Trial Moderator →
  Support Lead → Support → Developer → Designer → Community Manager →
  Content Creator → Event Manager → Event Host → Booster → VIP+ → VIP →
  Champion → Elite → Diamond → Gold → Silver → Bronze → Verified → Java
  Player → Bedrock Player → Veteran → Member. Set `tickets.staffRoleId` to
  your moderator-or-above role so staff can see/manage tickets.

## Adding New Commands

Drop a new file into the relevant `src/commands/<category>/` folder
exporting `{ data, execute }` (see any existing command for the shape),
then run `npm run deploy` again to register it with Discord.

## Adding New Events

Drop a new file into `src/events/` exporting `{ name, once?, execute }`.
Multiple files can listen to the same event name (see
`messageCreateLeveling.js` / `messageCreateAutomod.js`) to keep unrelated
logic separated.
