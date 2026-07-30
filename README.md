# aredl-bot

Discord bot that looks up levels on the [All Rated Extreme Demons List](https://aredl.net/) (AREDL).

## Command

`/level query:<level name or level ID>` — shows an embed with the level's list position,
description, level ID, list points, publisher, verifier and tags. Autocomplete suggests
level names as you type.

The embed color reflects difficulty: bright red (`#ff0000`) at the bottom of the list,
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
