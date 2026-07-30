const {
    SlashCommandBuilder,
    ApplicationIntegrationType,
    InteractionContextType,
} = require('discord.js');

const levelCommand = new SlashCommandBuilder()
    .setName('level')
    .setDescription('Look up a level on the All Rated Extreme Demons List')
    .addStringOption((opt) =>
        opt
            .setName('query')
            .setDescription('Level name or level ID')
            .setRequired(true)
            .setAutocomplete(true)
    )
    // installable both on servers and on user accounts
    .setIntegrationTypes(
        ApplicationIntegrationType.GuildInstall,
        ApplicationIntegrationType.UserInstall
    )
    // usable in servers, bot DMs and private channels / group DMs
    .setContexts(
        InteractionContextType.Guild,
        InteractionContextType.BotDM,
        InteractionContextType.PrivateChannel
    );

module.exports = { levelCommand };
