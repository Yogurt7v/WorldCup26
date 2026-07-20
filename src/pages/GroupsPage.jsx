import { useState } from "react";
import groupsData from "../data/groups.json";
import bracketData from "../data/bracket.json";
import useScrollToTop from "../hooks/useScrollToTop";
import GroupStandings from "../components/GroupStandings";
import KnockoutBracket from "../components/KnockoutBracket";

export default function GroupsPage() {
  useScrollToTop();

  const [tab, setTab] = useState("groups");

  const handleTabChange = (newTab) => {
    setTab(newTab);
  };

  const groupsLoading = false;
  const bracketLoading = false;

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
          <GroupStandings groups={groupsData} />
        </>
      ) : (
        <>
          <KnockoutBracket columns={bracketData} />
        </>
      )}
    </div>
  );
}
