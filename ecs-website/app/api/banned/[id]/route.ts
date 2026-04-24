import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isStaff } from "@/lib/roles";
import { Role } from "@prisma/client";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !isStaff(session.user.role as Role)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }
  const { id } = await params;
  const ban = await prisma.bannedPlayer.update({ where: { id }, data: { active: false } });
  return NextResponse.json({ ban });
}
