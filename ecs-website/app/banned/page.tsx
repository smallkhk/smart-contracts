import { prisma } from "@/lib/prisma";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-ZA", { year: "numeric", month: "short", day: "numeric", timeZone: "Africa/Johannesburg" }).format(new Date(date));
}

export default async function BannedPlayersPage() {
  const bans = await prisma.bannedPlayer.findMany({ where: { active: true }, orderBy: { createdAt: "desc" } });
  const expired = await prisma.bannedPlayer.findMany({ where: { active: false }, orderBy: { createdAt: "desc" }, take: 10 });

  return (
    <div>
      <div className="relative py-14 px-4 text-center overflow-hidden" style={{ background: "linear-gradient(180deg,#2a0000 0%,#0d0d0d 100%)", borderBottom: "1px solid #3a1a1a" }}>
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "repeating-linear-gradient(45deg,#ef5350 0,#ef5350 1px,transparent 0,transparent 50%)", backgroundSize: "20px 20px" }} />
        <div className="relative">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 tracking-widest" style={{ background: "#3a0000", color: "#ef5350", border: "1px solid #ef535040" }}>⚠ ECS DISCIPLINARY LIST</div>
          <h1 className="text-4xl font-black text-white">Banned Players</h1>
          <p className="text-gray-400 mt-2 text-sm">Players banned from ECS scrims for misconduct or rule violations.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <h2 className="text-xl font-black text-white">Active Bans <span className="ml-2 text-sm font-normal px-2 py-0.5 rounded" style={{ background: "#3a1a1a", color: "#ef5350" }}>{bans.length}</span></h2>
          </div>
          {bans.length === 0 ? (
            <div className="card p-10 text-center text-gray-500">No players are currently banned. Keep it clean! 🤝</div>
          ) : (
            <div className="flex flex-col gap-3">
              {bans.map((ban) => (
                <div key={ban.id} className="rounded-xl overflow-hidden" style={{ border: "1px solid #3a1a1a", background: "#110808" }}>
                  <div style={{ height: "2px", background: "linear-gradient(90deg,#ef5350,#b71c1c)" }} />
                  <div className="p-5 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <span className="font-black text-white text-lg">{ban.ign}</span>
                        {ban.discordTag && <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ background: "#1a1a2a", color: "#7289da" }}>{ban.discordTag}</span>}
                        <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: ban.permanent ? "#3a0000" : "#2a1800", color: ban.permanent ? "#ef5350" : "#f5a623" }}>{ban.permanent ? "🔴 PERMANENT" : "⏳ TEMP"}</span>
                      </div>
                      <div className="text-sm text-gray-300 mt-1"><span className="text-gray-500">Reason: </span>{ban.reason}</div>
                      <div className="text-xs text-gray-600 mt-2 flex gap-4 flex-wrap">
                        <span>Banned by: <span className="text-gray-400">{ban.bannedBy}</span></span>
                        <span>Date: <span className="text-gray-400">{formatDate(ban.createdAt)}</span></span>
                        {ban.expiresAt && <span>Expires: <span className="text-yellow-600">{formatDate(ban.expiresAt)}</span></span>}
                      </div>
                    </div>
                    <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ background: "#3a0000", border: "1px solid #5a1a1a" }}>🚫</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {expired.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-5"><div className="w-2 h-2 rounded-full bg-gray-600" /><h2 className="text-lg font-bold text-gray-500">Past Bans (lifted / expired)</h2></div>
            <div className="flex flex-col gap-2">
              {expired.map((ban) => (
                <div key={ban.id} className="card p-4 opacity-50">
                  <div className="flex items-center justify-between gap-4">
                    <div><span className="font-bold text-gray-400">{ban.ign}</span>{ban.discordTag && <span className="text-xs text-gray-600 ml-2">{ban.discordTag}</span>}<div className="text-xs text-gray-600 mt-1">{ban.reason}</div></div>
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: "#1a1a1a", color: "#555" }}>LIFTED</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 p-4 rounded-lg text-sm text-gray-500" style={{ background: "#0f0f0f", border: "1px solid #1a1a1a" }}>
          <strong className="text-gray-400">ECS Ban Policy:</strong> Players may be banned for cheating, toxic behaviour, no-shows, stream sniping, or repeated rule violations. To appeal a ban, contact ECS staff on Discord.
        </div>
      </div>
    </div>
  );
}
