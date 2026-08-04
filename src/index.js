require('dotenv').config();
const { Client, GatewayIntentBits, MessageFlags } = require('discord.js');
const {
    ensureList,
    findLevel,
    suggestLevels,
    getLevelDetails,
    getMaxPosition,
    findPlayer,
    suggestPlayers,
} = require('./aredl');
const { buildLevelEmbed, buildPlayerEmbed } = require('./embed');

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

async function replyError(interaction, err) {
    console.error('Command error:', err);
    const message = 'Something went wrong while fetching that. Please try again.';
    if (interaction.deferred || interaction.replied) {
        await interaction.editReply(message).catch(() => {});
    } else {
        await interaction
            .reply({ content: message, flags: MessageFlags.Ephemeral })
            .catch(() => {});
    }
}

client.on('interactionCreate', async (interaction) => {
    if (interaction.isAutocomplete()) {
        try {
            const query = interaction.options.getFocused();
            if (interaction.commandName === 'level') {
                await interaction.respond(await suggestLevels(query));
            } else if (interaction.commandName === 'player') {
                await interaction.respond(await suggestPlayers(query));
            }
        } catch (err) {
            console.error('Autocomplete error:', err);
            await interaction.respond([]).catch(() => {});
        }
        return;
    }

    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'level') {
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
            await interaction.editReply({
                embeds: [buildLevelEmbed(details, getMaxPosition())],
            });
        } catch (err) {
            await replyError(interaction, err);
        }
        return;
    }

    if (interaction.commandName === 'player') {
        try {
            await interaction.deferReply();
            const query = interaction.options.getString('query', true);
            const result = await findPlayer(query);

            if (!result) {
                await interaction.editReply(
                    `No player matching **${query}** was found on the AREDL.`
                );
                return;
            }

            await interaction.editReply({
                embeds: [buildPlayerEmbed(result.profile, result.entry)],
            });
        } catch (err) {
            await replyError(interaction, err);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
