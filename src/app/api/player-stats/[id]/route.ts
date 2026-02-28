import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/auth-helpers";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  await auth.protect();
  const { id } = await params;

  const stat = await prisma.playerStat.findFirst({
    where: { id, deletedAt: null },
    include: { player: true },
  });
  if (!stat) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(stat);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const denied = await assertAdmin();
  if (denied) return denied;
  const { id } = await params;

  const stat = await prisma.playerStat.findFirst({ where: { id, deletedAt: null } });
  if (!stat) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const { mlbTeam, stats } = body;

  const updated = await prisma.playerStat.update({
    where: { id },
    data: {
      ...(mlbTeam !== undefined && { mlbTeam }),
      ...(stats !== undefined && { stats }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const denied = await assertAdmin();
  if (denied) return denied;
  const { id } = await params;

  const stat = await prisma.playerStat.findFirst({ where: { id, deletedAt: null } });
  if (!stat) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.playerStat.update({ where: { id }, data: { deletedAt: new Date() } });

  return new NextResponse(null, { status: 204 });
}
