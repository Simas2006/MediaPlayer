# MediaPlayer/Discord

Note: MediaPlayer/Discord is not required in order to run MediaPlayer, however, MediaPlayer/Discord will not properly operate while the core is not active.

## How to Install

MediaPlayer/Discord is used alongside the core, and is used to control the core using Discord integration.

To use MediaPlayer/Discord, you need an API token, which you can get at https://discordapp.com/developers/applications/me, by creating a new app and adding a "Bot User".

Create a Discord server (roles unnecessary) and add your bot to it by going to https://discordapp.com/oauth2/authorize?client_id=CLIENTID&scope=bot, replacing CLIENTID with the actual client id.

Make a file named `token.txt` in this directory and copy the bot token into it (found on the same page).

## How to Use

Run `node main.js` in this directory, and wait for the `Bot active` message. All commands start with `!`. Enter `!help` for a list of commands.
