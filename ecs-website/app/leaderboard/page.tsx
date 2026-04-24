import { prisma } from "@/lib/prisma";

async function getStandings() {
  const teams = await prisma.team.findMany({
    where: { status: "APPROVED" },
    include: { homeResults: true, awayResults: true },
    orderBy: { name: "asc" },
  });

  const standings = teams.map((team) => {
    let wins = 0, losses = 0, draws = 0;
    for (const r of team.homeResults) {
      if (r.homeScore > r.awayScore) wins++;
      else if (r.homeScore < r.awayScore) losses++;
      else draws++;
    }
    for (const r of team.awayResults) {
      if (r.awayScore > r.homeScore) wins++;
      else if (r.awayScore < r.homeScore) losses++;
      else draws++;
    }
    const played = wins + losses + draws;
    const points = wins * 3 + draws;
    return { id: team.id, name: team.name, tag: team.tag, region: team.region, wins, losses, draws, played, points };
  });

  return standings.sort((a, b) => b.points - a.points || b.wins - a.wins || a.losses - b.losses);
}

export default async function LeaderboardPage() {
  const standings = await getStandings();
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <div className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 tracking-widest"
          style={{ background: "#1a0d00", color: "#f5a623", border: "1px solid #f5a62340" }}>
          SEASON STANDINGS
        </div>
        <h1 className="text-4xl font-black text-white">Leaderboard</h1>
        <p className="text-gray-400 mt-2">ECS COD Mobile BR · Win = 3pts · Draw = 1pt</p>
      </div>

      {standings.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[standings[1], standings[0], standings[2]].map((team, i) => {
            const actualRank = i === 0 ? 2 : i === 1 ? 1 : 3;
            const heights = ["h-28", "h-36", "h-24"];
            return (
              <div key={team.id} className={`flex flex-col items-center justify-end ${heights[i]}`}>
                <div className="text-2xl mb-1">{medals[actualRank - 1]}</div>
                <div className="w-full rounded-t-lg flex flex-col items-center justify-center p-3 text-center"
                  style={{
                    background: actualRank === 1 ? "linear-gradient(180deg,#3d2800,#1a0d00)" : actualRank === 2 ? "linear-gradient(180deg,#2a2a2a,#1a1a1a)" : "linear-gradient(180deg,#1a1505,#0d0d0d)",
                    border: `1px solid ${actualRank === 1 ? "#f5a623" : actualRank === 2 ? "#aaa" : "#cd7f32"}`,
                    minHeight: actualRank === 1 ? "120px" : "90px",
                  }}>
                  <div className="font-black text-lg" style={{ color: actualRank === 1 ? "#f5a623" : actualRank === 2 ? "#ccc" : "#cd7f32" }}>[{team.tag}]</div>
                  <div className="font-bold text-white text-sm mt-1">{team.name}</div>
                  <div className="text-2xl font-black mt-1" style={{ color: actualRank === 1 ? "#f5a623" : actualRank === 2 ? "#ccc" : "#cd7f32" }}>
                    {team.points}<span className="text-xs font-normal text-gray-500 ml-1">pts</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {standings.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">No match data yet. Results will appear here after scrims.</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#1a1a1a", borderBottom: "1px solid #2a2a2a" }}>
                <th className="px-4 py-3 text-left text-gray-500 font-semibold uppercase tracking-wider text-xs w-10">#</th>
                <th className="px-4 py-3 text-left text-gray-500 font-semibold uppercase tracking-wider text-xs">Team</th>
                <th className="px-4 py-3 text-center text-gray-500 font-semibold uppercase tracking-wider text-xs">P</th>
                <th className="px-4 py-3 text-center text-gray-500 font-semibold uppercase tracking-wider text-xs">W</th>
                <th className="px-4 py-3 text-center text-gray-500 font-semibold uppercase tracking-wider text-xs">D</th>
                <th className="px-4 py-3 text-center text-gray-500 font-semibold uppercase tracking-wider text-xs">L</th>
                <th className="px-4 py-3 text-center text-yellow-500 font-semibold uppercase tracking-wider text-xs">PTS</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((team, idx) => (
                <tr key={team.id} style={{ borderBottom: "1px solid #1a1a1a", background: idx === 0 ? "#1a0e0040" : idx % 2 === 0 ? "#0f0f0f" : "#141414" }}>
                  <td className="px-4 py-3 text-center">{idx < 3 ? <span className="text-base">{medals[idx]}</span> : <span className="text-gray-600 font-mono">{idx + 1}</span>}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded flex items-center justify-center font-black text-black text-xs shrink-0" style={{ background: "linear-gradient(135deg,#f5a623,#ff6b35)" }}>{team.tag.slice(0, 3)}</div>
                      <div><div className="font-bold text-white">{team.name}</div><div className="text-xs text-gray-600">{team.region}</div></div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-400">{team.played}</td>
                  <td className="px-4 py-3 text-center text-green-400 font-bold">{team.wins}</td>
                  <td className="px-4 py-3 text-center text-yellow-500">{team.draws}</td>
                  <td className="px-4 py-3 text-center text-red-400">{team.losses}</td>
                  <td className="px-4 py-3 text-center"><span className="font-black text-base" style={{ color: "#f5a623" }}>{team.points}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-gray-600 mt-4 text-center">P = Played · W = Won · D = Draw · L = Lost · PTS = Points (W×3, D×1)</p>
    </div>
  );
}
