require('dotenv').config();
const { Client, GatewayIntentBits, MessageFlags } = require('discord.js');
const { ensureList, findLevel, suggestLevels, getLevelDetails, getMaxPosition } = require('./aredl');
const { buildLevelEmbed } = require('./embed');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('clientReady', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    try {
        const list = await ensureList();
        console.log(`AREDL list cached: ${list.length} levels (max position ${getMaxPosition()})`);
    } catch (err) {
        console.error('Failed to prefetch AREDL list:', err);
    }
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isAutocomplete() && interaction.commandName === 'level') {
        try {
            const query = interaction.options.getFocused();
            await interaction.respond(await suggestLevels(query));
        } catch (err) {
            console.error('Autocomplete error:', err);
        }
        return;
    }

    if (!interaction.isChatInputCommand() || interaction.commandName !== 'level') return;

    try {
        await interaction.deferReply();
        const query = interaction.options.getString('query', true);
        const level = await findLevel(query);

        if (!level) {
            await interaction.editReply(
                `No level matching **${query}** was found on the AREDL.`
            );
            return;
        }

        const details = await getLevelDetails(level.id);
        await interaction.editReply({ embeds: [buildLevelEmbed(details, getMaxPosition())] });
    } catch (err) {
        console.error('Command error:', err);
        const message = 'Something went wrong while fetching that level. Please try again.';
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply(message).catch(() => {});
        } else {
            await interaction
                .reply({ content: message, flags: MessageFlags.Ephemeral })
                .catch(() => {});
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
