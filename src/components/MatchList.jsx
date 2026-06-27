import { useEffect, useRef } from "react";
import { useMatchesContext } from "../lib/MatchesContext";
import MatchCard from "./MatchCard";

export default function MatchList({
  matches,
  predictions,
  loading,
  error,
  syncError,
}) {
  const { syncing, refresh } = useMatchesContext();
  const predictionMap = {};
  if (predictions) {
    for (const p of predictions) {
      predictionMap[p.match_id] = p;
    }
  }

  const hasScrolled = useRef(false);

  useEffect(() => {
    if (!loading && matches.length > 0 && !hasScrolled.current) {
      const target = matches.find((m) => m.status !== "FINISHED");
      if (target) {
        hasScrolled.current = true;

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTimeout(() => {
              const el = document.getElementById(`match-${target.id}`);
              if (el) {
                const rect = el.getBoundingClientRect();

                // Проверяем, виден ли элемент уже в viewport
                const isVisible =
                  rect.top >= 0 && rect.top <= window.innerHeight;

                if (!isVisible) {
                  const header = document.querySelector(".layout-header");
                  const offset = header ? header.offsetHeight + 8 : 80;
                  const top = rect.top + window.scrollY - offset;
                  window.scrollTo({ top, behavior: "smooth" });
                }
              }
            }, 100);
          });
        });
      }
    }
  }, [loading, matches]);

  return (
    <div className="match-list">
      <div className="match-list-header">
        <h2>Расписание матчей</h2>
      </div>
      {syncError && (
        <div
          className="card"
          style={{
            textAlign: "center",
            padding: "0.6rem 1rem",
            marginBottom: "0.5rem",
            fontSize: "0.85rem",
            color: "var(--text-secondary)",
          }}
        >
          Не удалось обновить данные: {syncError}
        </div>
      )}
      {loading ? (
        <div className="spinner">Загрузка матчей...</div>
      ) : error ? (
        <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ color: "var(--danger)", marginBottom: "1rem" }}>
            Ошибка загрузки: {error}
          </p>
          <button className="btn btn-outline" onClick={refresh}>
            Повторить
          </button>
        </div>
      ) : matches.length === 0 ? (
        <div
          className="card"
          style={{
            textAlign: "center",
            color: "var(--text-secondary)",
            padding: "2rem",
          }}
        >
          {syncing
            ? "Синхронизация матчей..."
            : 'Нет доступных матчей. Нажмите "Обновить" для синхронизации.'}
        </div>
      ) : (
        matches.map((match) => (
          <div key={match.id} id={`match-${match.id}`}>
            <MatchCard match={match} userPrediction={predictionMap[match.id]} />
          </div>
        ))
      )}
    </div>
  );
}
