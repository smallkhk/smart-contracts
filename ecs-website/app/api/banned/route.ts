import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isStaff } from "@/lib/roles";
import { Role } from "@prisma/client";

export async function GET() {
  const bans = await prisma.bannedPlayer.findMany({ where: { active: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ bans });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isStaff(session.user.role as Role)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }
  const body = await req.json();
  const { ign, discordTag, reason, permanent, expiresAt } = body;
  if (!ign || !reason) return NextResponse.json({ error: "IGN and reason are required." }, { status: 400 });
  const ban = await prisma.bannedPlayer.create({
    data: { ign, discordTag, reason, bannedBy: session.user.discordTag ?? session.user.name ?? "Staff", permanent: permanent ?? true, expiresAt: expiresAt ? new Date(expiresAt) : null },
  });
  return NextResponse.json({ ban }, { status: 201 });
}
