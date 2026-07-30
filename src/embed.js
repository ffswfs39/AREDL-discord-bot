const { EmbedBuilder } = require('discord.js');

/**
 * Embed color scales from bright red (easiest, bottom of the list)
 * to pitch black (hardest, #1). Linear on the red channel.
 */
function difficultyColor(position, maxPosition) {
    if (maxPosition <= 1) return 0x000000;
    const t = (position - 1) / (maxPosition - 1);
    const red = Math.round(255 * t);
    return red << 16;
}

function displayName(user) {
    if (!user) return 'Unknown';
    return user.global_name || user.username || 'Unknown';
}

function buildLevelEmbed(details, maxPosition) {
    const verifiers = (details.verifications || []).map((v) => displayName(v.submitted_by));

    const embed = new EmbedBuilder()
        .setTitle(`${details.name.trim()} #${details.position}`)
        .setColor(difficultyColor(details.position, maxPosition))
        .addFields(
            { name: 'Level ID', value: String(details.level_id), inline: true },
            { name: 'List points', value: String(details.points), inline: true },
            { name: 'Publisher', value: displayName(details.publisher) },
            { name: 'Verifier', value: verifiers.length > 0 ? verifiers.join(', ') : 'Unknown' },
            {
                name: 'Tags',
                value:
                    details.tags && details.tags.length > 0 ? details.tags.join(', ') : 'None',
            }
        );

    if (details.description) {
        embed.setDescription(details.description);
    }

    return embed;
}

module.exports = { buildLevelEmbed };
