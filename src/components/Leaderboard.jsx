import { Fragment, useState, useMemo } from "react";
import { useLeaderboard } from "../hooks/useMatches";
import predictionsData from "../data/predictions.json";
import matchesData from "../data/matches.json";
import { getPredictionSummary, getPredictionTypeIcon } from "../lib/scoring";
import {
  getMatchDisplayDay,
  formatMatchDayHeader,
} from "../lib/formatters";

function rankClass(index) {
  if (index === 0) return "gold";
  if (index === 1) return "silver";
  if (index === 2) return "bronze";
  return "";
}

export default function Leaderboard() {
  const { leaderboard, loading, error } = useLeaderboard();
  const [expandedUserId, setExpandedUserId] = useState(null);

  const userPredictions = useMemo(() => {
    if (!expandedUserId) return [];

    return predictionsData
      .filter((p) => p.user_id === expandedUserId && p.points_earned > 0)
      .map((p) => ({
        ...p,
        matches: matchesData.find((m) => m.id === p.match_id) || null,
      }))
      .filter((p) => p.matches)
      .sort(
        (a, b) =>
          new Date(b.matches.match_date) - new Date(a.matches.match_date),
      );
  }, [expandedUserId]);

  const predictionsLoading = false;

  const handleToggle = (userId) => {
    setExpandedUserId(expandedUserId === userId ? null : userId);
  };

  if (loading) {
    return <div className="spinner">Загрузка таблицы...</div>;
  }

  if (error) {
    return (
      <div
        className="card"
        style={{ textAlign: "center", color: "var(--danger)", padding: "2rem" }}
      >
        Ошибка загрузки: {error}
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div
        className="card"
        style={{
          textAlign: "center",
          color: "var(--text-secondary)",
          padding: "2rem",
        }}
      >
        Пока нет участников. Сделайте первый прогноз!
      </div>
    );
  }

  return (
    <>
      <table className="leaderboard-table card">
        <thead>
          <tr>
            <th className="rank">#</th>
            <th>Игрок</th>
            <th className="points">Очки</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((row, i) => (
            <Fragment key={row.id}>
              <tr>
                <td className={`rank ${rankClass(i)}`}>{i + 1}</td>
                <td className="name" onClick={() => handleToggle(row.id)}>
                  {row.username}
                </td>
                <td className="points">{row.total_points}</td>
              </tr>
              {expandedUserId === row.id && (
                <tr className="expanded-row">
                  <td colSpan={3}>
                    {predictionsLoading ? (
                      <div className="spinner">Загрузка прогнозов...</div>
                    ) : userPredictions.length === 0 ? (
                      <div className="empty">Нет прогнозов с очками</div>
                    ) : (
                      <div className="user-scored-predictions">
                        {(() => {
                          const grouped = userPredictions.reduce((acc, p) => {
                            const day = getMatchDisplayDay(
                              p.matches.match_date,
                            );
                            if (!acc[day]) acc[day] = [];
                            acc[day].push(p);
                            return acc;
                          }, {});
                          return Object.entries(grouped).map(([day, preds]) => (
                            <Fragment key={day}>
                              <div className="day-group-header">
                                {formatMatchDayHeader(day)}
                              </div>
                              {preds.map((p) => (
                                <div
                                  key={p.id}
                                  className="scored-prediction-item"
                                >
                                  <span className="sp-match">
                                    {p.matches.home_team} {p.matches.home_score}
                                    :{p.matches.away_score}{" "}
                                    {p.matches.away_team}
                                  </span>
                                  <span className="sp-prediction">
                                    {getPredictionTypeIcon(p)}{" "}
                                    {getPredictionSummary(p)}
                                  </span>
                                  <span className="sp-points">
                                    +{p.points_earned}
                                  </span>
                                </div>
                              ))}
                            </Fragment>
                          ));
                        })()}
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </>
  );
}
