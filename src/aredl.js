const BASE = 'https://api.aredl.net/v2/api/aredl';
const REFRESH_MS = 60 * 60 * 1000; // refresh the cached list hourly

let levels = [];
let byUuid = new Map();
let byPosition = new Map();
let maxPosition = 1;
let lastFetched = 0;
let refreshPromise = null;

async function fetchJson(url) {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`AREDL API ${res.status} for ${url}`);
    return res.json();
}

async function refreshList() {
    const data = await fetchJson(`${BASE}/levels`);
    levels = data.filter((l) => !l.legacy);
    byUuid = new Map(levels.map((l) => [l.id, l]));
    byPosition = new Map(levels.map((l) => [l.position, l]));
    maxPosition = levels.reduce((m, l) => Math.max(m, l.position), 1);
    lastFetched = Date.now();
    return levels;
}

async function ensureList() {
    if (levels.length > 0 && Date.now() - lastFetched < REFRESH_MS) return levels;
    if (!refreshPromise) {
        refreshPromise = refreshList().finally(() => {
            refreshPromise = null;
        });
    }
    if (levels.length > 0) return levels;
    await refreshPromise;
    return levels;
}

function normalize(s) {
    return s.trim().toLowerCase();
}

function isDigits(s) {
    return /^\d+$/.test(s);
}

/**
 * Find a level by placement (#), in-game level ID, AREDL uuid, or name.
 */
async function findLevel(query) {
    const list = await ensureList();
    const q = normalize(query);
    if (!q) return null;

    if (byUuid.has(query.trim())) return byUuid.get(query.trim());

    if (isDigits(q)) {
        const num = Number(q);

        // Placement first for numbers that fit the list (e.g. "1" → Society)
        if (byPosition.has(num)) return byPosition.get(num);

        const byId = list.find((l) => l.level_id === num);
        if (byId) return byId;
    }

    const exact = list.find((l) => normalize(l.name) === q);
    if (exact) return exact;

    const starts = list.find((l) => normalize(l.name).startsWith(q));
    if (starts) return starts;

    const includes = list.find((l) => normalize(l.name).includes(q));
    if (includes) return includes;

    return null;
}

/** Autocomplete suggestions: up to 25 matches. Placement matches preferred for digits. */
async function suggestLevels(query) {
    const list = await ensureList();
    const q = normalize(query);
    let matches = [];

    if (!q) {
        matches = list.slice(0, 25);
    } else if (isDigits(q)) {
        const num = Number(q);
        const byPos = byPosition.get(num);
        if (byPos) matches.push(byPos);

        const posStarts = list.filter(
            (l) => l !== byPos && String(l.position).startsWith(q)
        );
        const idStarts = list.filter(
            (l) => !matches.includes(l) && !posStarts.includes(l) && String(l.level_id).startsWith(q)
        );
        matches = [...matches, ...posStarts, ...idStarts].slice(0, 25);
    } else {
        const starts = list.filter((l) => normalize(l.name).startsWith(q));
        const includes = list.filter(
            (l) => !normalize(l.name).startsWith(q) && normalize(l.name).includes(q)
        );
        matches = [...starts, ...includes].slice(0, 25);
    }

    return matches.map((l) => ({
        name: `${l.name} (#${l.position})`.slice(0, 100),
        value: l.id,
    }));
}

async function getLevelDetails(uuid) {
    return fetchJson(`${BASE}/levels/${uuid}`);
}

function getMaxPosition() {
    return maxPosition;
}

async function getPlayerProfile(id) {
    return fetchJson(`${BASE}/profile/${encodeURIComponent(id)}`);
}

async function getLeaderboardPage(page, perPage = 50) {
    return fetchJson(`${BASE}/leaderboard?page=${page}&per_page=${perPage}`);
}

async function searchLeaderboardByName(query, perPage = 25) {
    const filter = encodeURIComponent(`%${query}%`);
    return fetchJson(`${BASE}/leaderboard?name_filter=${filter}&per_page=${perPage}`);
}

/**
 * Find a player by global rank, Discord ID, AREDL uuid, or name.
 * Returns { entry, profile } or null.
 */
async function findPlayer(query) {
    const q = query.trim();
    if (!q) return null;

    // UUID
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q)) {
        const profile = await getPlayerProfile(q);
        return { entry: null, profile };
    }

    if (isDigits(q)) {
        // Discord snowflakes are 17–19 digits; ranks are much smaller
        if (q.length >= 15) {
            try {
                const profile = await getPlayerProfile(q);
                return { entry: null, profile };
            } catch {
                return null;
            }
        }

        const rank = Number(q);
        const perPage = 50;
        const page = Math.max(1, Math.ceil(rank / perPage));
        const lb = await getLeaderboardPage(page, perPage);
        const entry = (lb.data || []).find((e) => e.rank === rank);
        if (!entry) return null;
        const profile = await getPlayerProfile(entry.user.id);
        return { entry, profile };
    }

    const lb = await searchLeaderboardByName(q, 25);
    const rows = lb.data || [];
    if (rows.length === 0) return null;

    const nq = normalize(q);
    const exact =
        rows.find((e) => normalize(e.user.global_name || '') === nq) ||
        rows.find((e) => normalize(e.user.username || '') === nq) ||
        rows[0];

    const profile = await getPlayerProfile(exact.user.id);
    return { entry: exact, profile };
}

/** Autocomplete for players: placement or name. */
async function suggestPlayers(query) {
    const q = query.trim();

    if (!q) {
        const lb = await getLeaderboardPage(1, 25);
        return (lb.data || []).map((e) => ({
            name: `${e.user.global_name || e.user.username} (#${e.rank})`.slice(0, 100),
            value: e.user.id,
        }));
    }

    if (isDigits(q) && q.length < 15) {
        const rank = Number(q);
        const perPage = 25;
        const page = Math.max(1, Math.ceil(rank / perPage));
        const lb = await getLeaderboardPage(page, perPage);
        const rows = lb.data || [];
        const exact = rows.find((e) => e.rank === rank);
        const starts = rows.filter((e) => e !== exact && String(e.rank).startsWith(q));
        const ordered = exact ? [exact, ...starts] : starts.length ? starts : rows;
        return ordered.slice(0, 25).map((e) => ({
            name: `${e.user.global_name || e.user.username} (#${e.rank})`.slice(0, 100),
            value: e.user.id,
        }));
    }

    const lb = await searchLeaderboardByName(q, 25);
    return (lb.data || []).slice(0, 25).map((e) => ({
        name: `${e.user.global_name || e.user.username} (#${e.rank})`.slice(0, 100),
        value: e.user.id,
    }));
}

module.exports = {
    ensureList,
    findLevel,
    suggestLevels,
    getLevelDetails,
    getMaxPosition,
    findPlayer,
    suggestPlayers,
    getPlayerProfile,
};
