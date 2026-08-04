require('dotenv').config();
const { REST, Routes } = require('discord.js');
const { levelCommand, playerCommand } = require('./command');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token || !clientId) {
    console.error('DISCORD_TOKEN and CLIENT_ID must be set in .env');
    process.exit(1);
}

const rest = new REST().setToken(token);

(async () => {
    const commands = [levelCommand.toJSON(), playerCommand.toJSON()];
    const result = await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log(
        `Registered ${result.length} global command(s): ${result.map((c) => c.name).join(', ')}`
    );
})().catch((err) => {
    console.error('Failed to register commands:', err);
    process.exit(1);
});
