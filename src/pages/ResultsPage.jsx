import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import predictionsData from "../data/predictions.json";
import matchesData from "../data/matches.json";
import leaderboardData from "../data/leaderboard.json";
import { useConfetti } from "../hooks/useConfetti";

function calculateStats(predictions) {
  let outcomeCorrect = 0;
  let outcomeTotal = 0;
  let scoreCorrect = 0;
  let scoreTotal = 0;
  let goalsCorrect = 0;
  let goalsTotal = 0;

  for (const p of predictions) {
    const m = p.matches;
    if (!m || m.status !== "FINISHED") continue;

    const actualHome = m.home_score ?? 0;
    const actualAway = m.away_score ?? 0;
    const actualOutcome =
      actualHome > actualAway ? "1" : actualHome < actualAway ? "2" : "X";

    const hasScore =
      p.predicted_home_score != null && p.predicted_away_score != null;
    const hasOutcome = p.outcome != null;

    if (hasScore || hasOutcome) {
      outcomeTotal++;
      if (hasScore) {
        const predictedOutcome =
          p.predicted_home_score > p.predicted_away_score
            ? "1"
            : p.predicted_home_score < p.predicted_away_score
              ? "2"
              : "X";
        if (predictedOutcome === actualOutcome) outcomeCorrect++;
      } else if (p.outcome === actualOutcome) {
        outcomeCorrect++;
      }
    }

    if (hasScore) {
      scoreTotal++;
      if (
        p.predicted_home_score === actualHome &&
        p.predicted_away_score === actualAway
      ) {
        scoreCorrect++;
      }
    }

    if (p.goals_team && p.goals_threshold != null) {
      goalsTotal++;
      const actualGoals = p.goals_team === "home" ? actualHome : actualAway;
      if (actualGoals >= p.goals_threshold) goalsCorrect++;
    }
  }

  return {
    outcomePct:
      outcomeTotal > 0 ? Math.round((outcomeCorrect / outcomeTotal) * 100) : 0,
    outcomeCorrect,
    outcomeTotal,
    scorePct:
      scoreTotal > 0 ? Math.round((scoreCorrect / scoreTotal) * 100) : 0,
    scoreCorrect,
    scoreTotal,
    goalsPct:
      goalsTotal > 0 ? Math.round((goalsCorrect / goalsTotal) * 100) : 0,
    goalsCorrect,
    goalsTotal,
  };
}

function rusOrdinal(n) {
  const last = n % 10;
  const lastTwo = n % 100;
  if (lastTwo >= 11 && lastTwo <= 14) return `${n}-е`;
  if (last === 1) return `${n}-е`;
  if (last === 2) return `${n}-е`;
  if (last === 3) return `${n}-е`;
  return `${n}-е`;
}

function barColor(pct) {
  if (pct >= 60) return "#34c759";
  if (pct >= 30) return "#ff9f0a";
  return "#ff3b30";
}

export default function ResultsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const data = useMemo(() => {
    if (!user) return null;

    const userPredictions = predictionsData
      .filter((p) => p.user_id === user.id)
      .map((p) => ({
        ...p,
        matches: matchesData.find((m) => m.id === p.match_id) || null,
      }))
      .filter((p) => p.matches && p.matches.status === "FINISHED");

    const leaderboard = [...leaderboardData].sort(
      (a, b) => b.total_points - a.total_points
    );
    const rank = leaderboard.findIndex((u) => u.id === user.id) + 1;
    const totalPlayers = leaderboard.length;
    const myRow = leaderboard.find((u) => u.id === user.id);
    const stats = calculateStats(userPredictions);

    return {
      rank,
      totalPlayers,
      totalPoints: myRow?.total_points || 0,
      stats,
    };
  }, [user]);

  useConfetti(!!data);

  if (!data) return null;

  const { rank, totalPlayers, totalPoints, stats } = data;
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "";

  return (
    <div className="results-page">
      <div className="results-hero">
        {medal && <div className="results-medal">{medal}</div>}
        <div className="results-hero-title">Чемпионат завершён!</div>
        <div className="results-rank">
          Вы заняли
          <span className="results-rank-number">{rusOrdinal(rank)}</span>
          место из {totalPlayers} игроков
        </div>
        <div className="results-points-total">
          Всего очков: <strong>{totalPoints}</strong>
        </div>
      </div>

      <div className="results-stats-card">
        <StatRow
          label="Исходы матчей"
          correct={stats.outcomeCorrect}
          total={stats.outcomeTotal}
          pct={stats.outcomePct}
        />
        <StatRow
          label="Точный счёт"
          correct={stats.scoreCorrect}
          total={stats.scoreTotal}
          pct={stats.scorePct}
        />
        <StatRow
          label="Забил не менее"
          correct={stats.goalsCorrect}
          total={stats.goalsTotal}
          pct={stats.goalsPct}
        />
      </div>

      <button
        onClick={() => navigate("/")}
        className="btn btn-primary btn-full"
      >
        На главную
      </button>
    </div>
  );
}

function StatRow({ label, correct, total, pct }) {
  const color = barColor(pct);

  return (
    <div className="results-stat-row">
      <div className="results-stat-header">
        <span className="results-stat-label">{label}</span>
        <span className="results-stat-pct" style={{ color }}>
          {pct}%
        </span>
      </div>
      <div className="results-stat-bar-track">
        <div
          className="results-stat-bar-fill"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <div className="results-stat-count">
        {correct} из {total}
      </div>
    </div>
  );
}
