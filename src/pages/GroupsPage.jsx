import { useState, useEffect } from "react";
import { fetchGroupStandings, fetchKnockoutBracket } from "../lib/openligadb";
import GroupStandings from "../components/GroupStandings";
import KnockoutBracket from "../components/KnockoutBracket";

export default function GroupsPage() {
  const [tab, setTab] = useState("groups");
  const [groups, setGroups] = useState(null);
  const [groupsError, setGroupsError] = useState(false);
  const [bracketColumns, setBracketColumns] = useState(null);
  const [bracketError, setBracketError] = useState(false);

  const groupsLoading = tab === "groups" && !groups && !groupsError;
  const bracketLoading = tab === "knockout" && !bracketColumns && !bracketError;

  useEffect(() => {
    if (!groupsLoading) return;
    fetchGroupStandings().then((data) => {
      if (data) setGroups(data);
      else setGroupsError(true);
    });
  }, [groupsLoading]);

  useEffect(() => {
    if (!bracketLoading) return;
    fetchKnockoutBracket().then((data) => {
      if (data) setBracketColumns(data);
      else setBracketError(true);
    });
  }, [bracketLoading]);

  return (
    <div className="groups-page">
      <div className="tab-switch">
        <button
          className={`tab-btn${tab === "groups" ? " active" : ""}`}
          onClick={() => setTab("groups")}
        >
          Группы
        </button>
        <button
          className={`tab-btn${tab === "knockout" ? " active" : ""}`}
          onClick={() => setTab("knockout")}
        >
          Плей-офф
        </button>
      </div>
      {tab === "groups" ? (
        <>
          {groupsLoading ? (
            <div className="spinner">Загрузка групп...</div>
          ) : groups ? (
            <GroupStandings groups={groups} />
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
            <KnockoutBracket columns={bracketColumns} />
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
