import { useMemo } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { useMatch } from "../hooks/useMatches";
import { useAuth } from "../hooks/useAuth";
import predictionsData from "../data/predictions.json";
import { translateTeamName } from "../lib/teamNames";
import { getFlagForTeam } from "../lib/flags";
import { formatDateLong, formatTime, formatLocalTime } from "../lib/formatters";
import PredictionForm from "../components/PredictionForm";
import PredictionsList from "../components/PredictionsList";

export default function MatchDetails() {
  const { id } = useParams();
  const matchId = parseInt(id, 10);
  const { match, loading: matchLoading } = useMatch(matchId);
  const { user } = useAuth();

  const myPrediction = useMemo(() => {
    if (!user) return null;
    return predictionsData.find(
      (p) => p.user_id === user.id && p.match_id === matchId
    ) || null;
  }, [user, matchId]);

  const handleSaved = () => {};

  if (matchLoading) {
    return <div className="spinner">Загрузка матча...</div>;
  }

  if (!match) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "2rem",
          color: "var(--text-secondary)",
        }}
      >
        Матч не найден
      </div>
    );
  }

  return (
    <div className="match-details">
      <Link to="/" className="back-link">
        ← Назад к матчам
      </Link>

      <div className="match-hero card">
        <div
          className="match-header"
          style={{ justifyContent: "center", marginBottom: "0.5rem" }}
        >
          <span>
            {formatDateLong(match.match_date)}, {formatTime(match.match_date)}
          </span>
          {match.city && (
            <span
              style={{ marginLeft: "0.5rem", color: "var(--text-secondary)" }}
            >
              · {match.city},{" "}
              {formatLocalTime(match.match_date, match.timezone)}
              {match.stadium_name && ` · ${match.stadium_name}`}
            </span>
          )}
        </div>
        <div className="teams">
          <div className="team-name home">
            {getFlagForTeam(match.home_team)}{" "}
            {translateTeamName(match.home_team)}
          </div>
          <div className="score-display">
            {match.status === "SCHEDULED" ? (
              <span>- : -</span>
            ) : (
              <>
                <div className="main-score">
                  {match.home_score} : {match.away_score}
                </div>
                {match.home_penalty_score != null &&
                  match.away_penalty_score != null && (
                    <div className="penalty-score">
                      ({match.home_penalty_score}-{match.away_penalty_score})
                    </div>
                  )}
              </>
            )}
          </div>
          <div className="team-name away">
            {getFlagForTeam(match.away_team)}{" "}
            {translateTeamName(match.away_team)}
          </div>
        </div>
      </div>

      <PredictionForm
        match={match}
        existingPrediction={myPrediction}
        onSaved={handleSaved}
        key={`${match.id}-${myPrediction?.id || "new"}`}
      />

      <Link to="/" className="back-link">
        ← Назад к матчам
      </Link>

      <PredictionsList matchId={match.id} matchStatus={match.status} />
    </div>
  );
}
