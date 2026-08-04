const {
    SlashCommandBuilder,
    ApplicationIntegrationType,
    InteractionContextType,
} = require('discord.js');

const installTypes = [
    ApplicationIntegrationType.GuildInstall,
    ApplicationIntegrationType.UserInstall,
];

const contexts = [
    InteractionContextType.Guild,
    InteractionContextType.BotDM,
    InteractionContextType.PrivateChannel,
];

const levelCommand = new SlashCommandBuilder()
    .setName('level')
    .setDescription('Look up a level on the All Rated Extreme Demons List')
    .addStringOption((opt) =>
        opt
            .setName('query')
            .setDescription('Level name, placement (#), or level ID')
            .setRequired(true)
            .setAutocomplete(true)
    )
    .setIntegrationTypes(...installTypes)
    .setContexts(...contexts);

const playerCommand = new SlashCommandBuilder()
    .setName('player')
    .setDescription('Look up a player on the AREDL leaderboard')
    .addStringOption((opt) =>
        opt
            .setName('query')
            .setDescription('Player name, global rank (#), or Discord ID')
            .setRequired(true)
            .setAutocomplete(true)
    )
    .setIntegrationTypes(...installTypes)
    .setContexts(...contexts);

module.exports = { levelCommand, playerCommand };
