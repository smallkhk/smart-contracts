import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";

const MANAGER_ROLES: Role[] = [Role.MANAGER, Role.STAFF, Role.MOD, Role.ADMIN];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  if (!MANAGER_ROLES.includes(session.user.role as Role)) return NextResponse.json({ error: "Only managers or staff can register teams for scrims." }, { status: 403 });

  const { id: scrimId } = await params;
  const { teamId } = await req.json();
  if (!teamId) return NextResponse.json({ error: "teamId is required." }, { status: 400 });

  const scrim = await prisma.scrim.findUnique({ where: { id: scrimId } });
  if (!scrim || scrim.status !== "UPCOMING") return NextResponse.json({ error: "Scrim not found or not open." }, { status: 404 });

  const team = await prisma.team.findUnique({ where: { id: teamId, status: "APPROVED" } });
  if (!team) return NextResponse.json({ error: "Team not found or not approved." }, { status: 404 });

  const currentSignups = await prisma.scrimSignup.count({ where: { scrimId, status: "CONFIRMED" } });
  if (currentSignups >= scrim.maxTeams) return NextResponse.json({ error: "This scrim is full." }, { status: 409 });

  const existing = await prisma.scrimSignup.findUnique({ where: { scrimId_teamId: { scrimId, teamId } } });
  if (existing) {
    if (existing.status === "CONFIRMED") return NextResponse.json({ error: "Team already signed up." }, { status: 409 });
    const signup = await prisma.scrimSignup.update({ where: { id: existing.id }, data: { status: "CONFIRMED", registeredBy: session.user.id } });
    return NextResponse.json({ signup });
  }

  const signup = await prisma.scrimSignup.create({ data: { scrimId, teamId, registeredBy: session.user.id } });
  return NextResponse.json({ signup }, { status: 201 });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: scrimId } = await params;
  const signups = await prisma.scrimSignup.findMany({
    where: { scrimId, status: "CONFIRMED" },
    include: { team: { select: { name: true, tag: true, region: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ signups });
}
