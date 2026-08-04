# aredl-bot

Discord bot that looks up levels on the [All Rated Extreme Demons List](https://aredl.net/) (AREDL).

## Commands

`/level query:<name, placement, or level ID>` — level info embed (position, description,
level ID, list points, publisher, verifier, tags). Autocomplete supported. Typing a
placement number (e.g. `1`) looks up that list position.

`/player query:<name, global rank, or Discord ID>` — player stats embed with Discord pfp,
rank, level/pack/total points, extremes, hardest, country, and clan. Autocomplete
supported. Typing a rank number (e.g. `1`) looks up that leaderboard placement.

Level embed color reflects difficulty: bright red (`#ff0000`) at the bottom of the list,
fading to pitch black (`#000000`) at #1.

Works both as a **server app** and as a **user-installed (personal) app**.

## Setup

1. Create an application at the [Discord Developer Portal](https://discord.com/developers/applications).
2. On the **Installation** page, enable both **User Install** and **Guild Install**
   (install link: "Discord Provided Link").
3. On the **Bot** page, click **Reset Token** and copy the token.
4. Copy `.env.example` to `.env` and fill in `DISCORD_TOKEN` (bot token) and `CLIENT_ID`
   (Application ID from General Information).
5. Install and register:

```powershell
npm install
npm run deploy   # registers the /level slash command globally
npm start        # starts the bot
```

To add the bot to a server or your account, use the install link from the Installation page.

## Data source

Level data comes from the public AREDL API (`https://api.aredl.net/v2`). The full list is
cached in memory and refreshed hourly; publisher/verifier names are fetched per lookup.
