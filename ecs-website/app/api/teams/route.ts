import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, tag, region, captainName, contactDiscord, members } = body;

    if (!name || !tag || !region || !captainName || !contactDiscord) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }
    if (tag.length < 2 || tag.length > 5) {
      return NextResponse.json({ error: "Team tag must be 2–5 characters." }, { status: 400 });
    }

    const existing = await prisma.team.findFirst({ where: { OR: [{ name }, { tag }] } });
    if (existing) {
      return NextResponse.json({ error: "A team with that name or tag already exists." }, { status: 409 });
    }

    const session = await auth();

    const team = await prisma.team.create({
      data: {
        name,
        tag: tag.toUpperCase(),
        region,
        captainName,
        contactDiscord,
        members: {
          create: [
            { ign: captainName, role: "IGL", userId: session?.user?.id ?? undefined },
            ...(members ?? [])
              .filter((m: { ign: string }) => m.ign?.trim())
              .map((m: { ign: string; role: string }) => ({ ign: m.ign.trim(), role: m.role })),
          ],
        },
      },
    });

    return NextResponse.json({ team }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function GET() {
  const teams = await prisma.team.findMany({
    where: { status: "APPROVED" },
    include: { members: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ teams });
}
