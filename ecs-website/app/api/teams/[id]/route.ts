import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isStaff } from "@/lib/roles";
import { Role, TeamStatus } from "@prisma/client";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !isStaff(session.user.role as Role)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { status } = body;

  if (!Object.values(TeamStatus).includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const team = await prisma.team.update({ where: { id }, data: { status } });
  return NextResponse.json({ team });
}
