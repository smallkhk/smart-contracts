import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isStaff } from "@/lib/roles";
import { Role, ScrimStatus } from "@prisma/client";
import { sendDiscordWebhook } from "@/lib/discord";

export async function GET() {
  const results = await prisma.scrimResult.findMany({
    orderBy: { postedAt: "desc" },
    include: {
      scrim: true,
      homeTeam: { select: { name: true, tag: true, logo: true } },
      awayTeam: { select: { name: true, tag: true, logo: true } },
    },
  });
  return NextResponse.json({ results });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isStaff(session.user.role as Role)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { scrimId, homeTeamId, awayTeamId, homeScore, awayScore, mvp, vodUrl, notes } = body;

    if (!scrimId || !homeTeamId || !awayTeamId || homeScore == null || awayScore == null) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const result = await prisma.scrimResult.create({
      data: { scrimId, homeTeamId, awayTeamId, homeScore: Number(homeScore), awayScore: Number(awayScore), mvp, vodUrl, notes },
      include: { scrim: true, homeTeam: true, awayTeam: true },
    });

    await prisma.scrim.update({ where: { id: scrimId }, data: { status: ScrimStatus.COMPLETED } });
    await sendDiscordWebhook({ type: "result", data: result }).catch(() => null);
    return NextResponse.json({ result }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
