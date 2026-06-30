import { translateTeamName } from "./teamNames";

const API_BASE = "https://worldcup26.ir";

const COUNTRY_REGION_OFFSET = {
  Mexico: { Central: -6 },
  Canada: { Eastern: -4, Central: -5, Western: -7 },
  "United States": { Eastern: -4, Central: -5, Western: -7 },
};

const COUNTRY_REGION_TZ = {
  "United States": {
    Eastern: "America/New_York",
    Central: "America/Chicago",
    Western: "America/Los_Angeles",
  },
  Canada: {
    Eastern: "America/Toronto",
    Central: "America/Winnipeg",
    Western: "America/Vancouver",
  },
  Mexico: { Central: "America/Mexico_City" },
};

async function fetchStadiumData() {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () =>
      controller.abort(
        new DOMException("Таймаут запроса к worldcup26.ir", "TimeoutError"),
      ),
    60000,
  );
  try {
    const res = await fetch(`${API_BASE}/get/stadiums`, {
      signal: controller.signal,
    });
    const data = await res.json();
    const stadiums = data.stadiums || data;
    const info = {};
    for (const s of stadiums) {
      const offset = COUNTRY_REGION_OFFSET[s.country_en]?.[s.region];
      const timezone =
        COUNTRY_REGION_TZ[s.country_en]?.[s.region] || "Europe/Moscow";
      if (offset !== undefined) {
        info[s.id] = { offset, city: s.city_en, name_en: s.name_en, timezone };
      }
    }
    return info;
  } finally {
    clearTimeout(timeoutId);
  }
}

function parseMatchDate(dateStr, utcOffsetHours) {
  const [date, time] = dateStr.split(" ");
  const [month, day, year] = date.split("/");
  const [hh, mm] = time.split(":").map(Number);
  const utc =
    Date.UTC(+year, +month - 1, +day, hh, mm) - utcOffsetHours * 3600000;
  return new Date(utc).toISOString();
}

function parsePenaltyScore(val) {
  if (val == null || val === "" || val === "null") return null;
  const n = parseInt(val, 10);
  return isNaN(n) ? null : n;
}

function mapStatus(match) {
  const elapsed = (match.time_elapsed || "").toLowerCase();
  if (match.finished === "TRUE" || elapsed === "finished") return "FINISHED";
  if (elapsed === "live" || elapsed === "started") return "LIVE";
  if (elapsed === "halftime") return "HALFTIME";
  return "SCHEDULED";
}

function transformMatch(apiMatch, stadiumData) {
  const data = stadiumData[apiMatch.stadium_id] || {};
  const offset = data.offset != null ? data.offset : 0;
  return {
    id: parseInt(apiMatch.id, 10),
    league_id: 4897,
    home_team: translateTeamName(apiMatch.home_team_name_en) || "Unknown",
    away_team: translateTeamName(apiMatch.away_team_name_en) || "Unknown",
    match_date: parseMatchDate(apiMatch.local_date, offset),
    status: mapStatus(apiMatch),
    home_score: parseInt(apiMatch.home_score, 10) || 0,
    away_score: parseInt(apiMatch.away_score, 10) || 0,
    half_time_home_score: null,
    half_time_away_score: null,
    stadium_name: data.name_en || null,
    city: data.city || null,
    timezone: data.timezone || null,
    stage: apiMatch.type || null,
    home_penalty_score: parsePenaltyScore(apiMatch.home_penalty_score),
    away_penalty_score: parsePenaltyScore(apiMatch.away_penalty_score),
    last_update: new Date().toISOString(),
  };
}

export async function fetchGroupStandings() {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () =>
        controller.abort(
          new DOMException("Таймаут запроса к worldcup26.ir", "TimeoutError"),
        ),
      60000,
    );
    try {
      const [groupsRes, teamsRes] = await Promise.all([
        fetch(`${API_BASE}/get/groups`, { signal: controller.signal }),
        fetch(`${API_BASE}/get/teams`, { signal: controller.signal }),
      ]);

      if (!groupsRes.ok)
        throw new Error(`Failed to fetch groups: ${groupsRes.status}`);
      if (!teamsRes.ok)
        throw new Error(`Failed to fetch teams: ${teamsRes.status}`);

      const groupsData = await groupsRes.json();
      const teamsData = await teamsRes.json();

      const groups = groupsData.groups || groupsData;
      const teams = teamsData.teams || teamsData;

      const teamMap = {};
      for (const t of teams) {
        teamMap[t.id] = {
          name_en: t.name_en,
          fifa_code: t.fifa_code,
        };
      }

      return groups.map((g) => ({
        name: g.name,
        teams: g.teams.map((t) => ({
          team_id: t.team_id,
          name: translateTeamName(teamMap[t.team_id]?.name_en || "Unknown"),
          fifa_code: teamMap[t.team_id]?.fifa_code || "",
          mp: parseInt(t.mp, 10),
          w: parseInt(t.w, 10),
          l: parseInt(t.l, 10),
          d: parseInt(t.d, 10),
          pts: parseInt(t.pts, 10),
          gf: parseInt(t.gf, 10),
          ga: parseInt(t.ga, 10),
          gd: parseInt(t.gd, 10),
        })),
      }));
    } catch (err) {
      const msg =
        err.name === "TimeoutError" || err.name === "AbortError"
          ? "Таймаут соединения с сервером"
          : err.message;
      console.error(`Groups fetch error (attempt ${attempt}/3):`, msg);
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 10000));
      } else {
        return null;
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

const LABELS = {
  r32: [
    "A01",
    "A02",
    "A03",
    "A04",
    "A05",
    "A06",
    "A07",
    "A08",
    "A09",
    "A10",
    "A11",
    "A12",
    "A13",
    "A14",
    "A15",
    "A16",
  ],
  r16: ["B01", "B02", "B03", "B04", "B05", "B06", "B07", "B08"],
  qf: ["QF1", "QF2", "QF3", "QF4"],
  sf: ["SF1", "SF2"],
};

const LABEL_MAP = {};
for (const [stage, labels] of Object.entries(LABELS)) {
  for (let i = 0; i < labels.length; i++) {
    LABEL_MAP[`${stage}_${i}`] = labels[i];
  }
}
LABEL_MAP.final = "F1";
LABEL_MAP.third = "F3";

function labelFor(stage, idx) {
  if (stage === "final" || stage === "third") return LABEL_MAP[stage];
  return LABEL_MAP[`${stage}_${idx}`];
}

const STAGE_ROW = {
  r32: (i) => ({ row: i, span: 1 }),
  r16: (i) => ({ row: i * 2, span: 2 }),
  qf: (i) => ({ row: i * 4, span: 4 }),
  sf: (i) => ({ row: i * 8, span: 8 }),
  final: () => ({ row: 0, span: 16 }),
  third: () => ({ row: 0, span: 16 }),
};

const STAGE_SOURCES = {
  r16: (i) => ({ prev: "r32", indices: [i * 2, i * 2 + 1] }),
  qf: (i) => ({ prev: "r16", indices: [i * 2, i * 2 + 1] }),
  sf: (i) => ({ prev: "qf", indices: [i * 2, i * 2 + 1] }),
  final: () => ({ prev: "sf", indices: [0, 1] }),
  third: () => ({ prev: "sf", indices: [0, 1] }),
};

export async function fetchKnockoutBracket() {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () =>
        controller.abort(
          new DOMException("Таймаут запроса к worldcup26.ir", "TimeoutError"),
        ),
      60000,
    );
    try {
      const res = await fetch(`${API_BASE}/get/games`, {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Failed to fetch games: ${res.status}`);
      const data = await res.json();
      const games = data.games || data;

      const stageOrder = ["r32", "r16", "qf", "sf", "third", "final"];
      const colMap = {};
      const columns = [];

      for (const stage of stageOrder) {
        const stageGames = games.filter((g) => g.type === stage);
        if (stageGames.length === 0) continue;

        const matches = stageGames.map((g, i) => {
          const homeTeam = g.home_team_name_en
            ? translateTeamName(g.home_team_name_en)
            : null;
          const awayTeam = g.away_team_name_en
            ? translateTeamName(g.away_team_name_en)
            : null;
          const pos = STAGE_ROW[stage](i);
          const src = STAGE_SOURCES[stage] ? STAGE_SOURCES[stage](i) : null;
          return {
            id: parseInt(g.id, 10),
            label: labelFor(stage, i) || "",
            home_team: homeTeam,
            away_team: awayTeam,
            home_score:
              g.finished === "TRUE" && g.home_score != null
                ? parseInt(g.home_score, 10)
                : null,
            away_score:
              g.finished === "TRUE" && g.away_score != null
                ? parseInt(g.away_score, 10)
                : null,
            home_penalty_score: parsePenaltyScore(g.home_penalty_score),
            away_penalty_score: parsePenaltyScore(g.away_penalty_score),
            status: g.finished === "TRUE" ? "FINISHED" : "SCHEDULED",
            match_date: g.local_date || "",
            row: pos.row,
            span: pos.span,
            sourcePrevStage: src ? src.prev : null,
            sourcePrevIndices: src ? src.indices : null,
          };
        });

        const col = { stage, label: "", matches };
        columns.push(col);
        colMap[stage] = col;
      }

      const r32Col = colMap.r32;
      if (r32Col) r32Col.label = "1/16 финала";
      const r16Col = colMap.r16;
      if (r16Col) r16Col.label = "1/8 финала";
      const qfCol = colMap.qf;
      if (qfCol) qfCol.label = "1/4 финала";
      const sfCol = colMap.sf;
      if (sfCol) sfCol.label = "1/2 финала";
      const thirdCol = colMap.third;
      if (thirdCol) thirdCol.label = "3-е место";
      const finalCol = colMap.final;
      if (finalCol) finalCol.label = "Финал";

      return columns;
    } catch (err) {
      const msg =
        err.name === "TimeoutError" || err.name === "AbortError"
          ? "Таймаут соединения с сервером"
          : err.message;
      console.error(`Bracket fetch error (attempt ${attempt}/3):`, msg);
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 10000));
      } else {
        return null;
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export async function syncMatchesFromOpenLigaDB() {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () =>
        controller.abort(
          new DOMException("Таймаут запроса к worldcup26.ir", "TimeoutError"),
        ),
      60000,
    );

    try {
      const [gamesRes, stadiumData] = await Promise.all([
        fetch(`${API_BASE}/get/games`, { signal: controller.signal }),
        fetchStadiumData(),
      ]);

      if (!gamesRes.ok)
        throw new Error(`Failed to fetch matches: ${gamesRes.status}`);
      const data = await gamesRes.json();
      const matches = data.games || data;
      return matches.map((m) => transformMatch(m, stadiumData));
    } catch (err) {
      const msg =
        err.name === "TimeoutError" || err.name === "AbortError"
          ? "Таймаут соединения с сервером"
          : err.message;
      console.error(`Sync error (attempt ${attempt}/3):`, msg);

      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 10000));
      } else {
        return [];
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
