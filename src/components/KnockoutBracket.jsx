import { getFlagForTeam } from "../lib/flags";
import { translateTeamName } from "../lib/teamNames";

const STAGE_ORDER = ["r32", "r16", "qf", "sf",  "third", "final",];
const STAGE_LABELS = {
  r32: "1/16 финала",
  r16: "1/8 финала",
  qf: "1/4 финала",
  sf: "1/2 финала",
  final: "Финал",
  third: "3-е место",
};

function getWinner(match) {
  if (match.home_score == null || match.away_score == null) return null;
  if (match.home_penalty_score != null && match.away_penalty_score != null) {
    return match.home_penalty_score > match.away_penalty_score ? "home" : "away";
  }
  if (match.home_score > match.away_score) return "home";
  if (match.away_score > match.home_score) return "away";
  return null;
}

function formatBracketScore(match) {
  if (match.home_score == null || match.away_score == null) return "–";
  const score = `${match.home_score}:${match.away_score}`;
  if (match.home_penalty_score != null && match.away_penalty_score != null) {
    return `${score} (${match.home_penalty_score}-${match.away_penalty_score})`;
  }
  return score;
}

function TeamBlock({ name, label, isTbd, winner }) {
  if (isTbd || !name) {
    return (
      <div className="b-match-team tbd">
        <span className="b-match-label">{label}</span>
      </div>
    );
  }
  return (
    <div className={`b-match-team${winner ? " winner" : ""}`}>
      <span className="b-match-flag">{getFlagForTeam(name)}</span>
      <span className="b-match-name">{translateTeamName(name)}</span>
    </div>
  );
}

function MatchCard({ match }) {
  const homeTbd = !match.home_team;
  const awayTbd = !match.away_team;
  const winner = getWinner(match);

  return (
    <div className={`b-match${homeTbd && awayTbd ? " tbd" : ""}`}>
      <TeamBlock name={match.home_team} label={match.label} isTbd={homeTbd} winner={winner === "home"} />
      <div className="b-match-score">
        {formatBracketScore(match)}
      </div>
      <TeamBlock name={match.away_team} label={match.label} isTbd={awayTbd} winner={winner === "away"} />
    </div>
  );
}

export default function KnockoutBracket({ columns }) {

  if (!columns || columns.length === 0) return null;

  const colMap = {};
  columns.forEach((col) => {
    colMap[col.stage] = col;
  });

  // function toggle(stage) {
  //   setCollapsed((prev) => ({ ...prev, [stage]: !prev[stage] }));
  // }

  return (
    <div className="bracket-scroll">
      <div className="bracket-grid">
        {STAGE_ORDER.map((stage) => {
          const col = colMap[stage];
          if (!col) return null;

          return (
            <div key={stage} className={`${stage === "third" ? " b-col-third" : ""}${stage === "final" ? " b-col-final" : ""}`}>
              <div className="b-col-header">
                <span className="b-col-label">{STAGE_LABELS[stage]}</span>
              </div>
              <div className="b-col-body">
                {col.matches.map((m, i) => (
                  <MatchCard key={m.id || `${stage}-${i}`} match={m} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
