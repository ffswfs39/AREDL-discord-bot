const { EmbedBuilder } = require('discord.js');
const { formatCountry } = require('./countries');

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

function formatNumber(n) {
    if (n == null) return '—';
    return Number(n).toLocaleString('en-US');
}

function discordAvatarUrl(discordId, avatarHash) {
    if (!discordId || !avatarHash) return null;
    const ext = String(avatarHash).startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.${ext}?size=256`;
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

/**
 * Build a player stats embed from profile (+ optional leaderboard entry for hardest).
 */
function buildPlayerEmbed(profile, entry) {
    const rank = profile.rank || {};
    const name = displayName(profile);
    const globalRank = rank.rank != null ? rank.rank : entry?.rank;
    const totalPoints = rank.total_points ?? entry?.total_points ?? 0;
    const packPoints = rank.pack_points ?? entry?.pack_points ?? 0;
    const levelPoints = Math.max(0, totalPoints - packPoints);
    const extremes = rank.extremes ?? entry?.extremes;
    const extremesRank = rank.extremes_rank ?? entry?.extremes_rank;
    const hardest =
        entry?.hardest?.name ||
        (Array.isArray(profile.records) && profile.records[0]?.level?.name) ||
        '—';
    const clan = profile.clan?.tag || profile.clan?.global_name || entry?.clan?.tag || null;

    const title = globalRank != null ? `${name} #${globalRank}` : name;

    const embed = new EmbedBuilder()
        .setTitle(title)
        .setColor(0x1f4e78)
        .addFields(
            { name: 'Rank', value: globalRank != null ? String(globalRank) : '—', inline: true },
            {
                name: 'Extremes rank',
                value: extremesRank != null ? String(extremesRank) : '—',
                inline: true,
            },
            { name: 'Level points', value: formatNumber(levelPoints), inline: true },
            { name: 'Pack points', value: formatNumber(packPoints), inline: true },
            { name: 'Total points', value: formatNumber(totalPoints), inline: true },
            { name: 'Extremes', value: extremes != null ? formatNumber(extremes) : '—', inline: true },
            { name: 'Hardest', value: String(hardest).trim() || '—', inline: true },
            { name: 'Country', value: formatCountry(profile.country ?? entry?.country), inline: true }
        );

    if (clan) {
        embed.addFields({ name: 'Clan', value: clan });
    }

    if (profile.description) {
        embed.setDescription(profile.description);
    }

    const avatar = discordAvatarUrl(profile.discord_id, profile.discord_avatar);
    if (avatar) embed.setThumbnail(avatar);

    return embed;
}

module.exports = { buildLevelEmbed, buildPlayerEmbed };
