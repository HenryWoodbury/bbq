import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  await auth.protect();
  const { id } = await params;

  const stat = await prisma.statDefinition.findFirst({ where: { id, deletedAt: null } });
  if (!stat) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(stat);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  await auth.protect();
  const { id } = await params;

  const stat = await prisma.statDefinition.findFirst({ where: { id, deletedAt: null } });
  if (!stat) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const { abbreviation, name, description, format } = body;

  const updated = await prisma.statDefinition.update({
    where: { id },
    data: {
      ...(abbreviation !== undefined && { abbreviation }),
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(format !== undefined && { format }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  await auth.protect();
  const { id } = await params;

  const stat = await prisma.statDefinition.findFirst({ where: { id, deletedAt: null } });
  if (!stat) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.statDefinition.update({ where: { id }, data: { deletedAt: new Date() } });

  return new NextResponse(null, { status: 204 });
}
