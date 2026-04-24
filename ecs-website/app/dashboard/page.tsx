import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isStaff } from "@/lib/roles";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user || !isStaff(session.user.role as Role)) redirect("/");

  const [pendingTeams, scrims, approvedTeams, activeBans] = await Promise.all([
    prisma.team.findMany({ where: { status: "PENDING" }, include: { members: true }, orderBy: { createdAt: "asc" } }),
    prisma.scrim.findMany({ where: { status: { in: ["UPCOMING", "ONGOING"] } }, include: { signups: { include: { team: { select: { name: true, tag: true } } } } }, orderBy: { scheduledAt: "asc" } }),
    prisma.team.findMany({ where: { status: "APPROVED" }, select: { id: true, name: true, tag: true }, orderBy: { name: "asc" } }),
    prisma.bannedPlayer.findMany({ where: { active: true }, orderBy: { createdAt: "desc" } }),
  ]);

  return <DashboardClient pendingTeams={pendingTeams} scrims={scrims} approvedTeams={approvedTeams} activeBans={activeBans} userRole={session.user.role as Role} />;
}
