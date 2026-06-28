import { useState, useEffect, useRef } from "react";
import { fetchGroupStandings, fetchKnockoutBracket } from "../lib/openligadb";
import { formatCacheTime } from "../lib/formatters";
import useScrollToTop from "../hooks/useScrollToTop";
import GroupStandings from "../components/GroupStandings";
import KnockoutBracket from "../components/KnockoutBracket";

const GROUPS_CACHE_KEY = "groups-cache";
const BRACKET_CACHE_KEY = "bracket-cache";

function loadCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.data || !parsed.timestamp) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveCache(key, data) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({ data, timestamp: new Date().toISOString() }),
    );
  } catch {
    /* ignore */
  }
}

export default function GroupsPage() {
  useScrollToTop();

  const hasGroupsCache = useRef(false);
  const hasBracketCache = useRef(false);

  const [tab, setTab] = useState("groups");
  const [groups, setGroups] = useState(() => {
    const cached = loadCache(GROUPS_CACHE_KEY);
    if (cached) hasGroupsCache.current = true;
    return cached ? cached.data : null;
  });
  const [groupsTime, setGroupsTime] = useState(() => {
    const cached = loadCache(GROUPS_CACHE_KEY);
    return cached ? cached.timestamp : null;
  });
  const [groupsRefreshing, setGroupsRefreshing] = useState(false);
  const [groupsError, setGroupsError] = useState(false);
  const [bracketColumns, setBracketColumns] = useState(() => {
    const cached = loadCache(BRACKET_CACHE_KEY);
    if (cached) hasBracketCache.current = true;
    return cached ? cached.data : null;
  });
  const [bracketTime, setBracketTime] = useState(() => {
    const cached = loadCache(BRACKET_CACHE_KEY);
    return cached ? cached.timestamp : null;
  });
  const [bracketRefreshing, setBracketRefreshing] = useState(false);
  const [bracketError, setBracketError] = useState(false);

  const handleTabChange = (newTab) => {
    setTab(newTab);
    if (newTab === "groups") setGroupsError(false);
    else setBracketError(false);
  };

  useEffect(() => {
    if (tab !== "groups") return;

    setGroupsRefreshing(true);
    let cancelled = false;
    fetchGroupStandings()
      .then((data) => {
        if (cancelled) return;
        if (data) {
          setGroups(data);
          const now = new Date().toISOString();
          setGroupsTime(now);
          saveCache(GROUPS_CACHE_KEY, data);
          setGroupsError(false);
        } else if (!hasGroupsCache.current) {
          setGroupsError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setGroupsRefreshing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tab]);

  useEffect(() => {
    if (tab !== "knockout") return;

    setBracketRefreshing(true);
    let cancelled = false;
    fetchKnockoutBracket()
      .then((data) => {
        if (cancelled) return;
        if (data) {
          setBracketColumns(data);
          const now = new Date().toISOString();
          setBracketTime(now);
          saveCache(BRACKET_CACHE_KEY, data);
          setBracketError(false);
        } else if (!hasBracketCache.current) {
          setBracketError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setBracketRefreshing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tab]);

  const groupsLoading = tab === "groups" && !groups && !groupsError;
  const bracketLoading = tab === "knockout" && !bracketColumns && !bracketError;

  return (
    <div className="groups-page">
      <div className="tab-switch">
        <button
          className={`tab-btn${tab === "groups" ? " active" : ""}`}
          onClick={() => handleTabChange("groups")}
        >
          Группы
        </button>
        <button
          className={`tab-btn${tab === "knockout" ? " active" : ""}`}
          onClick={() => handleTabChange("knockout")}
        >
          Плей-офф
        </button>
      </div>
      {tab === "groups" ? (
        <>
          {groupsTime && (
            <div className="cache-timestamp">
              Данные от {formatCacheTime(groupsTime)}
              {groupsRefreshing && (
                <span className="refreshing"> (обновление...)</span>
              )}
            </div>
          )}
          {groupsLoading ? (
            <div className="spinner">Загрузка групп...</div>
          ) : groups ? (
            <>
              <GroupStandings groups={groups} />
            </>
          ) : (
            <div className="card match-list-empty">
              Не удалось загрузить данные групп
            </div>
          )}
        </>
      ) : (
        <>
          {bracketLoading ? (
            <div className="spinner">Загрузка сетки плей-офф...</div>
          ) : bracketColumns ? (
            <>
              <KnockoutBracket columns={bracketColumns} />
              {bracketTime && (
                <div className="cache-timestamp">
                  Данные от {formatCacheTime(bracketTime)}
                  {bracketRefreshing && (
                    <span className="refreshing"> (обновление...)</span>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="card match-list-empty">
              Не удалось загрузить данные сетки
            </div>
          )}
        </>
      )}
    </div>
  );
}
