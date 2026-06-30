import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { translateTeamName } from "../lib/teamNames";
import { getFlagForTeam } from "../lib/flags";
import { getPredictionTypeIcon, getPredictionSummary } from "../lib/scoring";
import {
  formatDateShort,
  formatTime,
  formatLocalTime,
  isInMoscowNightWindow,
} from "../lib/formatters";

function MatchCard({ match, userPrediction }) {
  const navigate = useNavigate();

  const isFinished = match.status === "FINISHED";
  const isLive = match.status === "LIVE" || match.status === "HALFTIME";
  const canPredict = !isFinished && !isLive;
  const isUpcomingNight =
    match.status === "SCHEDULED" && isInMoscowNightWindow(match.match_date);

  return (
    <div
      className={`match-card card${isFinished ? " finished" : ""}${isUpcomingNight ? " upcoming" : ""}`}
      onClick={() => navigate(`/match/${match.id}`)}
    >
      <div className="match-header">
        <div className="match-header-left">
          <span className="match-date">
            {formatDateShort(match.match_date)} {formatTime(match.match_date)}
          </span>
          {userPrediction ? (
            <>
              <span className="prediction-indicator">
                {getPredictionTypeIcon(userPrediction)}{" "}
                {getPredictionSummary(userPrediction)}
              </span>
              {isFinished && (
                <span
                  className={`points-earned points-${userPrediction.points_earned === 5 ? "5" : userPrediction.points_earned >= 3 ? "3-4" : "0"}`}
                >
                  {userPrediction.points_earned > 0
                    ? `+${userPrediction.points_earned}`
                    : "0"}
                </span>
              )}
            </>
          ) : (
            canPredict && (
              <span className="prediction-indicator">Сделать прогноз</span>
            )
          )}
          {!canPredict && !userPrediction && isLive && (
            <span
              className="prediction-indicator"
              style={{ background: "#fefce8", color: "#a16207" }}
            >
              Идёт матч
            </span>
          )}
        </div>
        <div className="match-header-right">
          {match.city && (
            <span
              className="match-city-local"
              title={`${match.city}, ${formatLocalTime(match.match_date, match.timezone)}`}
            >
              {match.city}, {formatLocalTime(match.match_date, match.timezone)}
            </span>
          )}
        </div>
      </div>
      <div className="match-body">
        <div className="team home">
          {getFlagForTeam(match.home_team)} {translateTeamName(match.home_team)}
        </div>
        <div className="score">
          {match.status === "SCHEDULED" ? (
            <span className="score-none">- : -</span>
          ) : (
            <>
              <div className="match-score-main">
                {match.home_score} : {match.away_score}
              </div>
              {match.home_penalty_score != null &&
                match.away_penalty_score != null && (
                  <div className="match-score-penalty">
                    ({match.home_penalty_score}-{match.away_penalty_score})
                  </div>
                )}
            </>
          )}
        </div>
        <div className="team away">
          {getFlagForTeam(match.away_team)} {translateTeamName(match.away_team)}
        </div>
      </div>
    </div>
  );
}

export default memo(MatchCard);
