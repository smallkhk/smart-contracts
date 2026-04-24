import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isStaff } from "@/lib/roles";
import { ScrimFormat, Role } from "@prisma/client";
import { sendDiscordWebhook } from "@/lib/discord";

export async function GET() {
  const scrims = await prisma.scrim.findMany({
    orderBy: { scheduledAt: "asc" },
    include: { result: { include: { homeTeam: true, awayTeam: true } } },
  });
  return NextResponse.json({ scrims });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isStaff(session.user.role as Role)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { title, description, scheduledAt, format, maxTeams, rules, prizePool } = body;

    if (!title || !scheduledAt) {
      return NextResponse.json({ error: "Title and date are required." }, { status: 400 });
    }

    const scrim = await prisma.scrim.create({
      data: {
        title,
        description,
        scheduledAt: new Date(scheduledAt),
        format: (format as ScrimFormat) ?? ScrimFormat.BO3,
        maxTeams: maxTeams ?? 16,
        rules,
        prizePool,
      },
    });

    await sendDiscordWebhook({ type: "scrim", data: scrim }).catch(() => null);
    return NextResponse.json({ scrim }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
