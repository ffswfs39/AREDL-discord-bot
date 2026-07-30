const BASE = 'https://api.aredl.net/v2/api/aredl';
const REFRESH_MS = 60 * 60 * 1000; // refresh the cached list hourly

let levels = [];
let byUuid = new Map();
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
    maxPosition = levels.reduce((m, l) => Math.max(m, l.position), 1);
    lastFetched = Date.now();
    return levels;
}

async function ensureList() {
    if (levels.length > 0 && Date.now() - lastFetched < REFRESH_MS) return levels;
    // dedupe concurrent refreshes
    if (!refreshPromise) {
        refreshPromise = refreshList().finally(() => {
            refreshPromise = null;
        });
    }
    // if we have a stale cache, refresh in background but serve immediately
    if (levels.length > 0) return levels;
    await refreshPromise;
    return levels;
}

function normalize(s) {
    return s.trim().toLowerCase();
}

/**
 * Find a level by level ID (in-game numeric id), AREDL uuid, or name.
 * Returns the cached list entry or null.
 */
async function findLevel(query) {
    const list = await ensureList();
    const q = normalize(query);
    if (!q) return null;

    if (byUuid.has(query)) return byUuid.get(query);

    if (/^\d+$/.test(q)) {
        const idNum = Number(q);
        const byId = list.find((l) => l.level_id === idNum);
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

/** Autocomplete suggestions: up to 25 matches, hardest first. */
async function suggestLevels(query) {
    const list = await ensureList();
    const q = normalize(query);
    let matches;
    if (!q) {
        matches = list.slice(0, 25);
    } else if (/^\d+$/.test(q)) {
        matches = list.filter((l) => String(l.level_id).startsWith(q)).slice(0, 25);
        if (matches.length === 0) {
            matches = list.filter((l) => normalize(l.name).includes(q)).slice(0, 25);
        }
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

/** Fetch full details (publisher + verifier names) for one level. */
async function getLevelDetails(uuid) {
    return fetchJson(`${BASE}/levels/${uuid}`);
}

function getMaxPosition() {
    return maxPosition;
}

module.exports = { ensureList, findLevel, suggestLevels, getLevelDetails, getMaxPosition };
